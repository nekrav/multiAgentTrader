export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: "user" | "admin";
}

export interface AuthTokenPayload extends AuthUser {
  sessionId: string;
}

export interface AuthRequest {
  user?: AuthUser;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  ip?: string;
}
