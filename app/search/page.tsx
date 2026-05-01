export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kërko Pjesë Këmbimi | Auto Forms Shqipëri',
  description: 'Gjeni pjesë këmbimi origjinale dhe alternative në të gjithë Shqipërinë. Filtro sipas markës, modelit, çmimit dhe qytetit.',
};

import SearchClient from './SearchClient';
import { Suspense } from 'react';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-blue-500">Duke ngarkuar...</div>}>
      <SearchClient />
    </Suspense>
  );
}