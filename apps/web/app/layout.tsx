import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./styles.css";

export const metadata: Metadata = {
  title: "AiTraders",
  description: "Multi-agent trading analytics dashboard",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#060807" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get("aitraders-theme")?.value;
  const theme = savedTheme === "light" ? "light" : "dark";

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
