import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getBearerOrCookieAccessToken } from "./auth-cookies";
import { AuthRequest, AuthTokenPayload } from "./auth.types";
import { UsersService } from "../users/users.service";

function isAuthTokenPayload(value: unknown): value is AuthTokenPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.id === "string" &&
    typeof payload.email === "string" &&
    (payload.displayName === null || typeof payload.displayName === "string") &&
    (payload.role === "user" || payload.role === "admin") &&
    typeof payload.sessionId === "string"
  );
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = getBearerOrCookieAccessToken(request);
    if (!token) {
      throw new UnauthorizedException("Missing auth token.");
    }

    try {
      const payload = await this.jwt.verifyAsync<Record<string, unknown>>(token);
      if (!isAuthTokenPayload(payload)) {
        throw new UnauthorizedException("Invalid auth token.");
      }
      const session = await this.users.findValidSession(payload.sessionId, payload.id);
      if (!session) {
        throw new UnauthorizedException("Session expired or revoked.");
      }
      const { sessionId: _sessionId, ...user } = payload;
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid auth token.");
    }
  }
}
