// app/search/page.tsx
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kërko Auto Pjesë - Të gjitha qytetet | AUTO PJESË Shqipëri',
  description: 'Gjeni pjesë këmbimi origjinale dhe alternative në Tiranë, Durrës, Vlorë dhe gjithë Shqipërinë. Filtro sipas markës, modelit, çmimit dhe qytetit.',
  openGraph: {
    title: 'Kërko Auto Pjesë në Shqipëri',
    description: 'Shfletoni mijëra pjesë këmbimi nga shitës lokalë. Kontaktoni direkt në WhatsApp ose telefon.',
    url: 'https://yourdomain.com/search',
    siteName: 'AUTO PJESË',
    images: [
      {
        url: 'https://yourdomain.com/og-image.jpg', // create this image (1200x630px)
        width: 1200,
        height: 630,
        alt: 'Auto Pjesë Search',
      },
    ],
    locale: 'sq_AL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kërko Auto Pjesë',
    description: 'Gjeni pjesë këmbimi në Shqipëri',
    images: ['https://yourdomain.com/og-image.jpg'],
  },
};

import SearchClient from './SearchClient';

export default function SearchPage() {
  return <SearchClient />;
}