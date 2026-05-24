import type { NextConfig } from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: `
                script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com;
                style-src 'self' 'unsafe-inline';
                img-src 'self' data: https:;
                connect-src 'self' https:;
                frame-src https://challenges.cloudflare.com;
              `.replace(/\s{2,}/g, ' ').trim(),
            },
          ],
        },
      ];
    }
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zexvczovzltylsqttmlr.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
};

export default withPWA(nextConfig);