import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Hedvig_Letters_Serif } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hedvigSerif = Hedvig_Letters_Serif({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-hedvig-serif",
});

export const metadata: Metadata = {
  title: "Agora",
  description: "A collaborative web document editor.",
};

export const viewport: Viewport = {
  themeColor: "#F1EEE4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${hedvigSerif.variable} antialiased bg-soft-linen`}
      >
        {children}
      </body>
    </html>
  );
}
