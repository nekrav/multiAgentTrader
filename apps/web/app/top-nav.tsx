"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { clearToken, getToken, apiFetch } from "./lib/api";

const navGroups = [
  {
    label: "Markets",
    items: [
      { href: "/forex", label: "Forex" },
      { href: "/crypto", label: "Crypto" },
      { href: "/stocks", label: "Stocks" },
      { href: "/cross-market", label: "Cross-Market" },
    ],
  },
  {
    label: "Strategy",
    items: [
      { href: "/decision-support", label: "Decision Support" },
      { href: "/strategies", label: "Playbook" },
      { href: "/reports", label: "Reports" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/run", label: "Run Analysis" },
      { href: "/backtesting", label: "Backtesting" },
      { href: "/setups", label: "Trade Setups" },
      { href: "/history", label: "Saved Analyses" },
      { href: "/alerts", label: "Alerts" },
      { href: "/admin", label: "Admin" },
    ],
  },
  {
    label: "Help",
    items: [
      { href: "/tutorial", label: "Tutorial" },
      { href: "/faq", label: "FAQ" },
    ],
  },
];

type Account = {
  user: {
    email: string;
    displayName: string | null;
    role: "user" | "admin";
  };
  balance: {
    balance: string;
  };
};

type Theme = "dark" | "light";

const themeCookieName = "aitraders-theme";

function readThemeCookie(): Theme | null {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${themeCookieName}=`));
  const value = cookie?.split("=")[1];
  return value === "light" || value === "dark" ? value : null;
}

function saveThemeCookie(theme: Theme) {
  document.cookie = `${themeCookieName}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function TopNav() {
  const apiHealthUrl = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/health`;
  const [account, setAccount] = useState<Account | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    if (!getToken()) {
      return;
    }
    void apiFetch<Account>("/auth/me")
      .then(setAccount)
      .catch(() => {
        clearToken();
        setAccount(null);
      });
  }, []);

  useEffect(() => {
    const savedTheme = readThemeCookie();
    const activeTheme =
      savedTheme ?? (document.documentElement.dataset.theme === "light" ? "light" : "dark");
    document.documentElement.dataset.theme = activeTheme;
    setTheme(activeTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    saveThemeCookie(nextTheme);
    setTheme(nextTheme);
  }

  const displayName = account?.user.displayName || account?.user.email.split("@")[0];
  const initials = displayName
    ? displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
    : "V";

  return (
    <>
      <a className="skipLink" href="#main-content">
        Skip To Trading Desk
      </a>
      <nav className="topNav" aria-label="Product sections">
        <a className="navBrand" href="/" translate="no">
          <Image
            className="navLogo"
            src="/assets/logo/logo-mark.svg"
            alt="AiTraders logo"
            width={28}
            height={28}
          />
          <strong>AiTraders</strong>
        </a>
        <div className="navLinks">
          <a className="navHome" href="/">
            Dashboard
          </a>
          {navGroups.map((group) => (
            <details className="navGroup" key={group.label}>
              <summary>{group.label}</summary>
              <div className="navMenu">
                {group.items.map((item) => (
                  <a href={item.href} key={item.href}>
                    {item.label}
                  </a>
                ))}
                {group.label === "Operations" ? <a href={apiHealthUrl}>API Health</a> : null}
              </div>
            </details>
          ))}
        </div>
        <div className="navActions">
          <button
            className="themeToggle"
            type="button"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            aria-pressed={theme === "light"}
            onClick={toggleTheme}
          >
            <span aria-hidden="true">{theme === "light" ? "L" : "D"}</span>
            <strong>{theme === "light" ? "Light" : "Dark"}</strong>
          </button>
          <a className="accountAvatar" href={account ? "/account" : "/login"} aria-label="Open account">
            <span className="avatarCircle" aria-hidden="true">
              {initials}
            </span>
            <span className="accountText">
              <strong>{displayName ?? "Login"}</strong>
              <small>{account ? `${account.balance.balance} credits` : "Credits"}</small>
            </span>
          </a>
        </div>
      </nav>
    </>
  );
}
