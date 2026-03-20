import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veto - Finnish iGaming Betting Slip",
  description: "Production-ready betting slip for Finnish gambling market",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {process.env.NODE_ENV === "development" && (
          <nav className="fixed top-0 left-0 right-0 z-50 flex h-9 items-center gap-4 border-b border-amber-900/50 bg-amber-950/95 px-4 text-xs text-amber-100 backdrop-blur-sm">
            <span className="font-mono font-semibold tracking-wide text-amber-400">
              DEV
            </span>
            <Link
              href="/"
              className="hover:text-white hover:underline"
              prefetch={false}
            >
              Home
            </Link>
            <Link
              href="/test"
              className="hover:text-white hover:underline"
              prefetch={false}
            >
              Test
            </Link>
            <Link
              href="/test/history"
              className="hover:text-white hover:underline"
              prefetch={false}
            >
              History
            </Link>
          </nav>
        )}
        <div
          className={
            process.env.NODE_ENV === "development" ? "min-h-screen pt-9" : ""
          }
        >
          {children}
        </div>
      </body>
    </html>
  );
}
