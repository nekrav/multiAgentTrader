"use client";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

export function getToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem("aitraders_token");
}

export function setToken(token: string) {
  window.localStorage.setItem("aitraders_token", token);
}

export function clearToken() {
  window.localStorage.removeItem("aitraders_token");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const token = getToken();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    const message = typeof body?.message === "string" ? body.message : body?.error ? String(body.error) : response.statusText;
    throw new ApiError(response.status, message, body);
  }
  return body as T;
}
