import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { AdminGuard } from "./admin.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";

export function jwtSecret() {
  const secret = process.env.JWT_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "aitraders-dev-secret-change-me-32-chars");
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long.");
  }
  return secret;
}

@Global()
@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: jwtSecret(),
      signOptions: { expiresIn: (process.env.JWT_ACCESS_TOKEN_TTL ?? "15m") as never },
    }),
  ],
  providers: [JwtAuthGuard, AdminGuard],
  exports: [JwtModule, JwtAuthGuard, AdminGuard],
})
export class AuthSupportModule {}
