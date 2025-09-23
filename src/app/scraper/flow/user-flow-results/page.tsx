import UserFlowResultsPage from '@/components/pages/UserFlowResultsPage';
import { getCurrentUser } from '@/lib/serverFunctions';

export default async function Page() {
  const user = await getCurrentUser();
  const initialData = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/scrape/flow/userFlowResults?userId=${user?.id}`, {
    cache: 'no-cache',
  }).then((res) => res.json());
  
  return <UserFlowResultsPage userId={user?.id} initialData={initialData?.results} />;
}
