import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PwaRegistry from "./PwaRegistry";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://auto-parts-platform.vercel.app"),
  title: {
    default: "VEKTRA - Gjej Pjesë Këmbimi Origjinale",
    template: "%s | VEKTRA",
  },
  description: "Platforma lider për kërkimin dhe shitjen e pjesëve të këmbimit origjinale. Lidhuni me pikat më të mëdha të skrapit dhe gjeni pjesën që ju duhet.",
  keywords: ["auto pjesë", "pjesë këmbimi", "pjesë origjinale", "skrap", "servis makinash", "vektra", "makina"],
  authors: [{ name: "VEKTRA" }],
  openGraph: {
    type: "website",
    locale: "sq_AL",
    url: "https://auto-parts-platform.vercel.app",
    siteName: "VEKTRA",
    title: "VEKTRA - Gjej Pjesë Këmbimi Origjinale",
    description: "Gjeni pjesë këmbimi origjinale nga pikat më të sigurta të skrapit.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "VEKTRA Albania",
      },
    ],
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VEKTRA",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
        media: "(device-width: 768px) and (device-height: 1024px)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
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
        <PwaRegistry />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "VEKTRA",
              "url": "https://auto-parts-platform.vercel.app",
              "logo": "https://auto-parts-platform.vercel.app/vektra.svg",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+355-00-000-000",
                "contactType": "customer service",
                "areaServed": "AL",
                "availableLanguage": ["Albanian", "English"]
              },
              "sameAs": [
                "https://www.facebook.com/vektra",
                "https://www.instagram.com/vektra"
              ]
            }),
          }}
        />
      </body>
    </html>
  );
}