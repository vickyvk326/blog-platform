'use server';
import FlowScraper from '@/components/pages/FlowScraper';
import { getCurrentUser } from '@/lib/serverFunctions';
type SearchParams = { [key: string]: string | string[] | undefined };
export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const flowResultId = await searchParams.resultId;
  const user = await getCurrentUser();
  const flowResult = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/scrape/flow/userFlowResultById?resultId=${flowResultId}`,
    { cache: 'force-cache' },
  ).then((res) => res.json());
  return <FlowScraper user={user} initialData={flowResult} />;
}
