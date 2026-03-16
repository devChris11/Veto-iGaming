import type { Metadata } from "next";
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
