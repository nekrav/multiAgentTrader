import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { AuthTokenPayload, AuthUser } from "./auth.types";
import {
  clearAuthCookies,
  CookieRequestLike,
  CookieResponseLike,
  generateRefreshToken,
  getClientIp,
  getCookie,
  hashSessionToken,
  REFRESH_TOKEN_COOKIE,
  refreshExpiresAt,
  setAuthCookies,
} from "./auth-cookies";
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly credits: CreditsService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: { email?: string; password?: string; displayName?: string }, request: CookieRequestLike, response: CookieResponseLike) {
    const email = normalizeEmail(input.email);
    this.requireValidPassword(input.password);
    if (!isValidEmail(email)) {
      throw new ConflictException("A valid email is required.");
    }

    const passwordHash = await hash(input.password!, 12);
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
    return this.issueSession(user, request, response);
  }

  async login(input: { email?: string; password?: string }, request: CookieRequestLike, response: CookieResponseLike) {
    const email = normalizeEmail(input.email);
    const user = await this.users.findByEmail(email);
    if (!user || !input.password || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password.");
    }
    return this.issueSession(user, request, response);
  }

  async refresh(request: CookieRequestLike, response: CookieResponseLike) {
    const rawRefreshToken = getCookie(request, REFRESH_TOKEN_COOKIE);
    if (!rawRefreshToken) {
      clearAuthCookies(response);
      throw new UnauthorizedException("Refresh token required.");
    }

    const tokenHash = hashSessionToken(rawRefreshToken);
    const session = await this.users.findSessionByTokenHash(tokenHash);
    if (!session || session.expiresAt <= new Date()) {
      if (session) {
        await this.users.deleteSessionByTokenHash(tokenHash);
      }
      clearAuthCookies(response);
      throw new UnauthorizedException("Invalid or expired refresh token.");
    }

    await this.users.refreshSession({
      id: session.id,
      expiresAt: refreshExpiresAt(),
      ipAddress: getClientIp(request),
      userAgent: String(request.headers["user-agent"] ?? "") || null,
    });

    const accessToken = this.signAccessToken(session.user, session.id);
    setAuthCookies(response, accessToken, rawRefreshToken);
    const balance = await this.credits.getBalance(session.user.id);
    return { user: session.user, balance };
  }

  async logout(request: CookieRequestLike, response: CookieResponseLike) {
    const rawRefreshToken = getCookie(request, REFRESH_TOKEN_COOKIE);
    if (rawRefreshToken) {
      await this.users.deleteSessionByTokenHash(hashSessionToken(rawRefreshToken));
    }
    clearAuthCookies(response);
    return { message: "Logged out" };
  }

  async me(user: AuthUser) {
    const balance = await this.credits.getBalance(user.id);
    return { user, balance };
  }

  private async issueSession(user: AuthUser, request: CookieRequestLike, response: CookieResponseLike) {
    await this.users.deleteExpiredSessions();
    const refreshToken = generateRefreshToken();
    const session = await this.users.createSession({
      userId: user.id,
      tokenHash: hashSessionToken(refreshToken),
      expiresAt: refreshExpiresAt(),
      ipAddress: getClientIp(request),
      userAgent: String(request.headers["user-agent"] ?? "") || null,
    });
    const accessToken = this.signAccessToken(user, session.id);
    setAuthCookies(response, accessToken, refreshToken);
    const balance = await this.credits.getBalance(user.id);
    return { user, balance };
  }

  private signAccessToken(user: AuthUser, sessionId: string) {
    const payload: AuthTokenPayload = { ...user, sessionId };
    return this.jwt.sign(payload);
  }

  private requireValidPassword(password?: string) {
    if (!password || password.length < 8) {
      throw new ConflictException("Password must be at least 8 characters.");
    }
  }
}
