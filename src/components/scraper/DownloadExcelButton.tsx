'use client';

import ExcelJS from 'exceljs';

import { Button } from '@/components/ui/button';

type Props = {
  buttonText?: string;
  variant?: 'default' | 'link' | 'destructive' | 'outline' | 'secondary' | 'ghost' | null | undefined;
  outputFileName?: string;
  headers: string[];
  rows: string[][];
};

export function DownloadExcel({
  buttonText = 'Download Excel',
  variant = 'default',
  outputFileName = 'scraped_data.xlsx',
  headers,
  rows,
}: Props) {
  const handleDownload = async () => {
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('Scraped Data');

    // Add headers
    worksheet.addRow(headers);

    // Add rows
    rows.forEach((row) => worksheet.addRow(row));

    // Auto-size columns
    worksheet.columns.forEach((col) => {
      let maxLength = 10;
      col.eachCell?.((cell) => {
        const len = cell.value ? cell.value.toString().length : 10;
        if (len > maxLength) maxLength = len;
      });
      col.width = maxLength + 2;
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create blob
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = outputFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleDownload} variant={variant}>
      {buttonText}
    </Button>
  );
}
