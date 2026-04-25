export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kërko Pjesë Këmbimi | Auto Forms Shqipëri',
  description: 'Gjeni pjesë këmbimi origjinale dhe alternative në të gjithë Shqipërinë. Filtro sipas markës, modelit, çmimit dhe qytetit.',
};

import SearchClient from './SearchClient';

export default function SearchPage() {
  return <SearchClient />;
}