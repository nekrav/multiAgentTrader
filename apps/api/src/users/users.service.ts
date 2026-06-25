import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { POSTGRES_POOL } from "../database/database.module";
import { AuthUser } from "../auth/auth.types";

export interface UserRecord extends AuthUser {
  passwordHash: string;
}

function toUser(row: Record<string, unknown>): AuthUser {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: row.display_name ? String(row.display_name) : null,
    role: row.role === "admin" ? "admin" : "user",
  };
}

@Injectable()
export class UsersService {
  constructor(@Inject(POSTGRES_POOL) private readonly postgres: Pool) {}

  async createUser(input: { email: string; passwordHash: string; displayName?: string | null; role?: "user" | "admin" }) {
    try {
      const result = await this.postgres.query(
        "insert into users(email, password_hash, display_name, role) values ($1, $2, $3, $4) returning id, email, display_name, role",
        [input.email.toLowerCase(), input.passwordHash, input.displayName ?? null, input.role ?? "user"],
      );
      return toUser(result.rows[0]);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "23505") {
        throw new ConflictException("Email is already registered.");
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.postgres.query(
      "select id, email, password_hash, display_name, role from users where email = $1",
      [email.toLowerCase()],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return { ...toUser(row), passwordHash: String(row.password_hash) };
  }

  async findById(id: string): Promise<AuthUser | null> {
    const result = await this.postgres.query("select id, email, display_name, role from users where id = $1", [id]);
    return result.rows[0] ? toUser(result.rows[0]) : null;
  }

  async createSession(input: { userId: string; tokenHash: string; expiresAt: Date; ipAddress: string; userAgent?: string | null }) {
    const result = await this.postgres.query(
      `insert into auth_sessions(user_id, token_hash, expires_at, ip_address, user_agent)
       values ($1, $2, $3, $4, $5)
       returning id`,
      [input.userId, input.tokenHash, input.expiresAt, input.ipAddress, input.userAgent ?? null],
    );
    return { id: String(result.rows[0].id) };
  }

  async findValidSession(id: string, userId: string) {
    const result = await this.postgres.query(
      `select id from auth_sessions
       where id = $1 and user_id = $2 and expires_at > now()`,
      [id, userId],
    );
    return result.rows[0] ? { id: String(result.rows[0].id) } : null;
  }

  async findSessionByTokenHash(tokenHash: string) {
    const result = await this.postgres.query(
      `select s.id as session_id, s.user_id, s.expires_at, u.id, u.email, u.display_name, u.role
       from auth_sessions s
       join users u on u.id = s.user_id
       where s.token_hash = $1`,
      [tokenHash],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: String(row.session_id),
      user: toUser(row),
      expiresAt: new Date(row.expires_at),
    };
  }

  async refreshSession(input: { id: string; expiresAt: Date; ipAddress: string; userAgent?: string | null }) {
    await this.postgres.query(
      `update auth_sessions
       set expires_at = $2, ip_address = $3, user_agent = $4, updated_at = now()
       where id = $1`,
      [input.id, input.expiresAt, input.ipAddress, input.userAgent ?? null],
    );
  }

  async deleteSessionByTokenHash(tokenHash: string) {
    await this.postgres.query("delete from auth_sessions where token_hash = $1", [tokenHash]);
  }

  async deleteExpiredSessions() {
    await this.postgres.query("delete from auth_sessions where expires_at <= now()");
  }
}
