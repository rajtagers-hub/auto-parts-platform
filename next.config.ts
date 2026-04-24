import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    // Only apply in development – you can remove this for production
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
};

export default nextConfig;