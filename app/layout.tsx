import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Auto Forms Shqipëri",
    template: "%s | Auto Forms Shqipëri",
  },
  description: "Platforma më e madhe për blerjen dhe shitjen e pjesëve të këmbimit në Shqipëri",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sq" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-black font-sans antialiased">
        {children}
      </body>
    </html>
  );
}