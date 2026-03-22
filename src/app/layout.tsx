import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { DevWidget } from "@/components/shared/DevWidget";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
      </head>
      <body className={`${notoSans.className} antialiased`}>
        {process.env.NODE_ENV === "development" && <DevWidget />}
        <div>{children}</div>
      </body>
    </html>
  );
}
