import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { DevWidget } from "@/components/shared/DevWidget";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
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
      <body className={`${instrumentSans.className} antialiased`}>
        {process.env.NODE_ENV === "development" && <DevWidget />}
        <div>{children}</div>
      </body>
    </html>
  );
}
