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
    default: "Auto Forms Albania - Gjej Pjesë Këmbimi Origjinale",
    template: "%s | Auto Forms Albania",
  },
  description: "Platforma lider në Shqipëri për kërkimin dhe shitjen e pjesëve të këmbimit origjinale. Lidhuni me pikat më të mëdha të skrapit dhe gjeni pjesën që ju duhet.",
  keywords: ["auto pjesë", "pjesë këmbimi", "pjesë origjinale", "skrap shqiperi", "servis makinash", "auto forms", "makina"],
  authors: [{ name: "Auto Forms Albania" }],
  openGraph: {
    type: "website",
    locale: "sq_AL",
    url: "https://autoforms.al",
    siteName: "Auto Forms Albania",
    title: "Auto Forms Albania - Gjej Pjesë Këmbimi Origjinale",
    description: "Gjeni pjesë këmbimi origjinale nga pikat më të sigurta të skrapit në Shqipëri.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Auto Forms Albania",
      },
    ],
  },
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