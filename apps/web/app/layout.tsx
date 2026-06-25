import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { AuthProvider } from "./auth-provider";
import "./styles.css";

export const metadata: Metadata = {
  title: "AiTraders",
  description: "Multi-agent trading analytics dashboard",
  icons: {
    icon: "/assets/logo/favicon.svg",
    shortcut: "/assets/logo/favicon.svg",
    apple: "/assets/logo/logo-icon.svg",
  },
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
  const savedDesign = cookieStore.get("aitraders-design")?.value;
  const theme = savedTheme === "light" ? "light" : "dark";
  const design = savedDesign === "simple" ? "simple" : "technical";

  return (
    <html lang="en" data-theme={theme} data-design={design} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
