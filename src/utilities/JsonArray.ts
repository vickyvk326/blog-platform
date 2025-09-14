import { createObjectCsvWriter } from 'csv-writer';
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import path from 'node:path';
import Logger from './Logger';

type ExportOptions = {
  dateFormat?: string;
  nullValue?: string;
};

class JsonArray<T extends Record<string, any>> {
  private data: T[];
  private logger: Logger;

  constructor(initialData: T[] = [], logger: Logger) {
    this.data = structuredClone(initialData); // Deep clone
    this.logger = logger;
  }

  // Add single item with type validation
  add(item: T): this {
    this.data.push(structuredClone(item));
    return this; // For method chaining
  }

  // Bulk insert with validation
  addMultiple(items: T[]): this {
    this.data.push(...items.map(item => structuredClone(item)));
    return this;
  }

  // Get immutable copy
  getArray(): ReadonlyArray<Readonly<T>> {
    return structuredClone(this.data);
  }

  // Create neccessary dirs
  private async ensureDirectoryExists(filePath: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);

      // Using modern recursive directory creation
      await fs.mkdir(dir, {
        recursive: true,
        mode: 0o755, // Standard directory permissions
      });

      // Verify directory was actually created
      try {
        await fs.access(dir, fs.constants.W_OK);
      } catch (accessError) {
        throw new Error(`Failed to verify directory write permissions: ${dir}`);
      }
    } catch (error) {
      throw new Error(`Directory creation failed for ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Modern Excel export with styling
  async exportToExcel(
    filePath: string,
    options: ExportOptions & { sheetName?: string; columns?: Partial<ExcelJS.Column>[] } = {},
  ): Promise<string | undefined> {
    try {
      this.logger.info(`Saving ${this.data.length} rows as XLSX...`);

      this.ensureDirectoryExists(filePath);

      const workbook = new ExcelJS.Workbook();

      const worksheet = workbook.addWorksheet(options.sheetName || 'Sheet 1');

      // Auto-detect headers if not provided
      const headers = Object.keys(this.data[0] || {});

      worksheet.columns =
        options.columns ||
        headers.map(header => ({
          header,
          key: header,
        }));

      // Add rows with data formatting
      this.data.forEach(row => {
        worksheet.addRow(
          headers.reduce(
            (acc, key) => {
              acc[key] = this.formatCellValue(row[key], options);
              return acc;
            },
            {} as Record<string, any>,
          ),
        );
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = Math.max(10, Math.min(50, (column.header?.length || 0) + 5));
      });

      await workbook.xlsx.writeFile(filePath);

      this.logger.info(`Excel file saved at ${filePath}`);

      return filePath;
    } catch (error) {
      this.logger.info(`Error exporting as Excel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // High-performance CSV export
  async exportToCsv(
    filePath: string,
    options: ExportOptions & {
      header?: string[];
      append?: boolean;
    } = {},
  ): Promise<void> {
    try {
      this.logger.info(`Saving ${this.data.length} rows as CSV...`);

      this.ensureDirectoryExists(filePath);

      const headers = options.header || Object.keys(this.data[0] || {});

      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: headers.map(h => ({ id: h, title: h })),
        append: options.append || false,
        alwaysQuote: true,
      });

      await csvWriter.writeRecords(
        this.data.map(row =>
          headers.reduce(
            (acc, key) => {
              acc[key] = this.formatCellValue(row[key], options);
              return acc;
            },
            {} as Record<string, any>,
          ),
        ),
      );
      this.logger.info(`CSV file saved at ${filePath}`);
    } catch (error) {
      this.logger.info(`Error exporting to CSV: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Standardized JSON export
  async exportToJson(filePath: string): Promise<void> {
    try {
      this.ensureDirectoryExists(filePath);
      this.logger.info(`Saving ${this.data.length} rows as JSON...`);
      await fs.writeFile(filePath, JSON.stringify(this.data, null, 2), 'utf-8');
      this.logger.info(`JSON file saved at ${filePath}`);
    } catch (error) {
      this.logger.info(`Error exporting to JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Human-readable text export
  async exportToText(
    filePath: string,
    options: {
      delimiter?: string;
      includeHeaders?: boolean;
    } = {},
  ): Promise<void> {
    try {
      this.logger.info(`Saving ${this.data.length} rows as TXT...`);

      this.ensureDirectoryExists(filePath);

      const delimiter = options.delimiter || ' | ';

      const headers = Object.keys(this.data[0] || {});

      let content = '';

      if (options.includeHeaders !== false) {
        content += headers.join(delimiter) + '\n';
      }

      content += this.data
        .map(row =>
          headers
            .map(
              header =>
                String(row[header] ?? '')
                  .replace(/\n/g, '\\n') // Escape newlines
                  .replace(new RegExp(delimiter, 'g'), '\\' + delimiter), // Escape delimiters
            )
            .join(delimiter),
        )
        .join('\n');

      await fs.writeFile(filePath, content, 'utf-8');
      this.logger.info(`TXT file saved at ${filePath}`);
    } catch (error) {
      this.logger.info(`Error exporting to TXT: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Private helper for consistent value formatting
  private formatCellValue(value: any, options: ExportOptions): string | number | boolean | Date {
    if (value === null || value === undefined) {
      return options.nullValue || '';
    }
    if (value instanceof Date) {
      return options.dateFormat ? value.toLocaleDateString(options.dateFormat) : value;
    }
    return value;
  }

  // Modern array methods
  filter(predicate: (item: T) => boolean): JsonArray<T> {
    return new JsonArray(this.data.filter(predicate), this.logger);
  }

  map<U extends Record<string, any>>(mapper: (item: T) => U): JsonArray<U> {
    return new JsonArray(this.data.map(mapper), this.logger);
  }

  // Statistics
  get count(): number {
    return this.data.length;
  }
}

export default JsonArray;
