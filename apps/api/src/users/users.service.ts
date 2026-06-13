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
}
