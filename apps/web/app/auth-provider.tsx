"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: "user" | "admin";
};

export type CreditBalance = {
  balance: string;
};

type AuthState = {
  user: AuthUser | null;
  balance: CreditBalance | null;
  loading: boolean;
  login: (user: AuthUser, balance?: CreditBalance | null) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
};

const AuthContext = createContext<AuthState | null>(null);
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function fetchMe() {
  const response = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
  if (!response.ok) return null;
  return (await response.json()) as { user: AuthUser; balance: CreditBalance };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((nextUser: AuthUser, nextBalance?: CreditBalance | null) => {
    setUser(nextUser);
    setBalance(nextBalance ?? null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      let data = await fetchMe();
      if (!data) {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (refreshResponse.ok) {
          data = await fetchMe();
        }
      }
      if (data) {
        setUser(data.user);
        setBalance(data.balance);
        return true;
      }
      setUser(null);
      setBalance(null);
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => undefined);
    setUser(null);
    setBalance(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return <AuthContext.Provider value={{ user, balance, loading, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
