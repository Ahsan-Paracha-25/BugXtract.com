import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BugXtract.com — Human insight. Software confidence.",
  description: "Manual-first software QA for web, mobile, desktop, and APIs.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
              history.scrollRestoration = "manual";
              window.addEventListener("pageshow", () => window.scrollTo(0, 0), { once: true });
            }`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
