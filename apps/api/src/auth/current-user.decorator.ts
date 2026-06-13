import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthRequest, AuthUser } from "./auth.types";

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUser => {
  const request = context.switchToHttp().getRequest<AuthRequest>();
  if (!request.user) {
    throw new Error("CurrentUser used without JwtAuthGuard");
  }
  return request.user;
});
