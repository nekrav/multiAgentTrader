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
  return null;
}

export function setToken(_token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("aitraders_token");
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("aitraders_token");
  }
}

async function readBody(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function shouldRefresh(path: string) {
  return !path.startsWith("/auth/login") && !path.startsWith("/auth/register") && !path.startsWith("/auth/refresh");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const hasJsonBody = init.body !== undefined && init.body !== null && !(init.body instanceof FormData);

  const request = () =>
    fetch(`${apiUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });

  let response = await request();
  if (response.status === 401 && shouldRefresh(path)) {
    const refreshResponse = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshResponse.ok) {
      response = await request();
    }
  }

  const body = await readBody(response);
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined" && shouldRefresh(path)) {
      window.location.href = "/login";
    }
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
    const message = typeof record?.message === "string" ? record.message : record?.error ? String(record.error) : response.statusText;
    throw new ApiError(response.status, message, body);
  }
  return body as T;
}
