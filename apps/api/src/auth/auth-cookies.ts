import { createHash, randomBytes } from "crypto";

export const ACCESS_TOKEN_COOKIE = "auth-token";
export const REFRESH_TOKEN_COOKIE = "refresh-token";

export type RequestHeaderValue = string | string[] | undefined;
export type ResponseHeaderValue = string | number | string[] | undefined;

export interface CookieRequestLike {
  headers: Record<string, RequestHeaderValue>;
  socket?: { remoteAddress?: string };
  ip?: string;
}

export interface CookieResponseLike {
  getHeader(name: string): ResponseHeaderValue;
  setHeader(name: string, value: string | string[]): void;
}

function parseDurationSeconds(value: string) {
  const match = /^(\d+)([smhd])?$/.exec(value);
  if (!match) {
    throw new Error("Token TTL must look like 15m, 1h, 7d, or seconds.");
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? "s";
  const multiplier = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 60 * 60 : 24 * 60 * 60;
  return amount * multiplier;
}

export const JWT_ACCESS_TOKEN_TTL_SECONDS = parseDurationSeconds(process.env.JWT_ACCESS_TOKEN_TTL ?? "15m");
export const REFRESH_SESSION_TTL_SECONDS = parseDurationSeconds(process.env.JWT_REFRESH_TOKEN_TTL ?? "30d");

export function generateRefreshToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshExpiresAt() {
  return new Date(Date.now() + REFRESH_SESSION_TTL_SECONDS * 1000);
}

export function getClientIp(request: CookieRequestLike) {
  const forwarded = request.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(forwardedValue ?? request.ip ?? request.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
}

export function getCookie(request: CookieRequestLike, name: string) {
  const header = request.headers.cookie;
  const cookieHeader = Array.isArray(header) ? header.join("; ") : header;
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }
  return undefined;
}

export function getBearerOrCookieAccessToken(request: CookieRequestLike) {
  const header = request.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  return value?.startsWith("Bearer ") ? value.slice("Bearer ".length) : getCookie(request, ACCESS_TOKEN_COOKIE);
}

function serializeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

function appendSetCookie(response: CookieResponseLike, cookie: string) {
  const current = response.getHeader("Set-Cookie");
  const next = Array.isArray(current) ? [...current, cookie] : current ? [String(current), cookie] : [cookie];
  response.setHeader("Set-Cookie", next);
}

export function setAuthCookies(response: CookieResponseLike, accessToken: string, refreshToken: string) {
  appendSetCookie(response, serializeCookie(ACCESS_TOKEN_COOKIE, accessToken, JWT_ACCESS_TOKEN_TTL_SECONDS));
  appendSetCookie(response, serializeCookie(REFRESH_TOKEN_COOKIE, refreshToken, REFRESH_SESSION_TTL_SECONDS));
}

export function clearAuthCookies(response: CookieResponseLike) {
  appendSetCookie(response, serializeCookie(ACCESS_TOKEN_COOKIE, "", 0));
  appendSetCookie(response, serializeCookie(REFRESH_TOKEN_COOKIE, "", 0));
}
