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
  metadataBase: new URL("https://vektra.com"),
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
    url: "https://vektra.com",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "VEKTRA",
              "url": "https://vektra.com",
              "logo": "https://vektra.com/vektra.svg",
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