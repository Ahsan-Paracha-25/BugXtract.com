import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { TawkChat } from "./tawk-chat";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BugXtract",
  alternateName: "BugXtract.com",
  url: "https://bugxtract.com",
  logo: "https://bugxtract.com/bugxtract-logo-512.png",
  description: "Manual-first software QA for web, mobile, desktop, and APIs.",
  email: "hello@bugxtract.com",
  sameAs: [
    "https://www.facebook.com/profile.php?id=61595187271380",
    "https://www.youtube.com/@BugXtract",
    "https://www.instagram.com/bugxtract",
    "https://www.tiktok.com/@bugxtract.com",
    "https://www.linkedin.com/company/bugxtract-com/posts/",
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bugxtract.com"),
  title: "BugXtract.com — Human insight. Software confidence.",
  description: "Manual-first software QA for web, mobile, desktop, and APIs.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/bugxtract-logo-512.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon-48.png",
    apple: "/bugxtract-logo-512.png",
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f9ff" },
    { media: "(prefers-color-scheme: dark)", color: "#07182f" },
  ],
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
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
              history.scrollRestoration = "manual";
              window.addEventListener("pageshow", () => window.scrollTo(0, 0), { once: true });
            }`,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Script src="/visitor-analytics.js?v=20261031-1" strategy="afterInteractive" />
        <Script src="/visitor-analytics-public.js?v=20261031-1" strategy="afterInteractive" />
        <TawkChat />
      </body>
    </html>
  );
}
