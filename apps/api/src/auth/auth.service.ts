import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { AuthUser } from "./auth.types";
import { CreditsService } from "../credits/credits.service";
import { UsersService } from "../users/users.service";

function normalizeEmail(email?: string) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly credits: CreditsService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: { email?: string; password?: string; displayName?: string }) {
    const email = normalizeEmail(input.email);
    this.requireValidPassword(input.password);
    if (!email.includes("@")) {
      throw new ConflictException("A valid email is required.");
    }

    const passwordHash = await hash(input.password!, 10);
    const user = await this.users.createUser({
      email,
      passwordHash,
      displayName: input.displayName?.trim() || null,
      role: adminEmails().has(email) ? "admin" : "user",
    });
    const signupCredits = BigInt(Math.max(0, Number(process.env.SIGNUP_CREDITS ?? 50)));
    if (signupCredits > 0n) {
      await this.credits.grant(user.id, signupCredits, "Signup credit grant.", `signup:${user.id}`);
    }
    return this.authResponse(user);
  }

  async login(input: { email?: string; password?: string }) {
    const email = normalizeEmail(input.email);
    const user = await this.users.findByEmail(email);
    if (!user || !input.password || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password.");
    }
    return this.authResponse(user);
  }

  async me(user: AuthUser) {
    const balance = await this.credits.getBalance(user.id);
    return { user, balance };
  }

  private authResponse(user: AuthUser & { passwordHash?: string }) {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return {
      token: this.jwt.sign(publicUser),
      user: publicUser,
    };
  }

  private requireValidPassword(password?: string) {
    if (!password || password.length < 8) {
      throw new ConflictException("Password must be at least 8 characters.");
    }
  }
}
