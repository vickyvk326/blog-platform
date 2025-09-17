import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DownloadExcel } from './DownloadExcelButton';

type TableResult = {
  [key: string]: string;
};

function ExtractedTable({ data }: { data: TableResult[] }) {
  if (!data || data.length === 0) return <p>No table data</p>;

  // Extract column headers from first row
  const headers = Object.keys(data[0]);

  return (
    <>
      <DownloadExcel outputFileName='table.xlsx' headers={headers} rows={data.map((row) => Object.values(row))} />
      <div className='rounded-lg border shadow-sm overflow-x-auto'>
        <Table className='overflow-x-auto mt-2 even:bg-muted'>
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
            {data.map((row, i) => (
              <TableRow key={i}>
                {headers.map((h) => (
                  <TableCell key={h}>{row[h] || '-'}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
export default ExtractedTable;
