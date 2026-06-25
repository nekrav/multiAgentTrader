import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { CurrentUser } from "./current-user.decorator";
import { AuthUser } from "./auth.types";
import { AuthService } from "./auth.service";
import { CookieRequestLike, CookieResponseLike } from "./auth-cookies";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(
    @Body() body: { email?: string; password?: string; displayName?: string },
    @Req() request: CookieRequestLike,
    @Res({ passthrough: true }) response: CookieResponseLike,
  ) {
    return this.auth.register(body, request, response);
  }

  @Post("login")
  login(
    @Body() body: { email?: string; password?: string },
    @Req() request: CookieRequestLike,
    @Res({ passthrough: true }) response: CookieResponseLike,
  ) {
    return this.auth.login(body, request, response);
  }

  @Post("refresh")
  refresh(@Req() request: CookieRequestLike, @Res({ passthrough: true }) response: CookieResponseLike) {
    return this.auth.refresh(request, response);
  }

  @Post("logout")
  logout(@Req() request: CookieRequestLike, @Res({ passthrough: true }) response: CookieResponseLike) {
    return this.auth.logout(request, response);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }
}
