'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

type UserFlowResult = {
  id: number;
  name?: string | null;
  userId: string;
  flowId: number;
  resultId?: number | null;
};

export default function UserFlowResultsPage({ userId, initialData }) {
  const [results, setResults] = useState<UserFlowResult[]>(initialData || []);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const fetchResults = async () => {
      // Don't fetch if it's the first render (page=0, we already have initialData)
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch(`/api/scrape/flow/userFlowResults?userId=${userId}&page=${page}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Failed to fetch userFlowResults', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [userId, page, pageSize]);

  return (
    <div className='container mx-auto py-10'>
      <Card>
        <CardHeader>
          <CardTitle>User Flow Results</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className='text-gray-500'>Loading...</p>
          ) : results.length === 0 ? (
            <p className='text-gray-500'>No results found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Flow ID</TableHead>
                  <TableHead>Result ID</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.name ?? '-'}</TableCell>
                    <TableCell>{r.flowId}</TableCell>
                    <TableCell>{r.resultId ?? '-'}</TableCell>
                    <TableCell>
                      <Link href={`/scraper/flow?resultId=${r.id}`}>
                        <Button variant='outline' size='sm'>
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          <div className='flex justify-between items-center mt-4'>
            <Button variant='outline' onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              Previous
            </Button>
            <span className='text-sm text-gray-500'>Page {page + 1}</span>
            <Button variant='outline' onClick={() => setPage((p) => p + 1)} disabled={results.length < pageSize}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
