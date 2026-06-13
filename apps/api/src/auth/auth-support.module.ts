import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AdminGuard } from "./admin.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";

export function jwtSecret() {
  const secret = process.env.JWT_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "aitraders-dev-secret");
  if (!secret) {
    throw new Error("JWT_SECRET is required in production.");
  }
  return secret;
}

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret(),
      signOptions: { expiresIn: "7d" },
    }),
  ],
  providers: [JwtAuthGuard, AdminGuard],
  exports: [JwtModule, JwtAuthGuard, AdminGuard],
})
export class AuthSupportModule {}
