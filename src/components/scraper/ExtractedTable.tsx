import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DownloadExcel } from './DownloadExcelButton';
import { DownloadIcon } from 'lucide-react';

type TableResult = {
  [key: string]: string;
};

function ExtractedTable({ data }: { data: TableResult[] }) {
  if (!data || data.length === 0) return <p className='text-muted-foreground text-sm font-medium'>No table data</p>;

  // Extract column headers from first row
  const headers = Object.keys(data[0]);

  return (
    <>
      <DownloadExcel
        buttonIcon={<DownloadIcon className='w-4 h-4 mr-1' />}
        outputFileName='table.xlsx'
        headers={headers}
        rows={data.map((row) => Object.values(row))}
      />

      <div className='max-h-80 rounded-lg border shadow-sm overflow-auto mt-2'>
        <Table className='overflow-auto mt-2 even:bg-muted' color='#333'>
          <TableHeader>
            <TableRow>
              {headers.map((h) => (
                <TableHead key={h} className='font-bold'>
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 25).map((row, i) => (
              <TableRow key={i}>
                {headers.map((h) => (
                  <TableCell key={h}>{row[h] || '-'}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length > 25 && (
          <p className='text-sm text-muted-foreground text-center mt-2'>Showing first 25 of {data.length} rows</p>
        )}
      </div>
    </>
  );
}
export default ExtractedTable;
