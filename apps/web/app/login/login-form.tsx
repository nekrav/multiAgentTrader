"use client";

import { FormEvent, useState } from "react";
import { useAuth, type AuthUser, type CreditBalance } from "../auth-provider";
import { apiFetch } from "../lib/api";

type AuthResponse = {
  user: AuthUser;
  balance: CreditBalance;
};

export function LoginForm({ mode }: { mode: "login" | "register" }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await apiFetch<AuthResponse>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password, displayName: displayName || undefined }),
      });
      login(response.user, response.balance);
      window.location.href = "/run";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="invokeForm authForm" onSubmit={submit}>
      <label>
        Email
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
      </label>
      {mode === "register" ? (
        <label>
          Display name
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" />
        </label>
      ) : null}
      <label>
        Password
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </label>
      <button className="primaryButton" disabled={loading} type="submit">
        {loading ? "Working..." : mode === "login" ? "Log In" : "Create Account"}
      </button>
      {error ? <p className="result error">{error}</p> : null}
    </form>
  );
}
