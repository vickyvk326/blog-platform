import fs from 'node:fs';
import path from 'node:path';

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: { retries?: number; delay?: number } = {},
): Promise<T> => {
  const { retries = 3, delay = 1000 } = options;
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) await sleep(delay * (i + 1));
    }
  }
  throw lastError ?? new Error('Retry failed with unknown error');
};

/**
 * ENVIRONMENT CHECKS
 */

export const isProduction = (): boolean => process.env.NODE_ENV === 'production';
export const isDevelopment = (): boolean => process.env.NODE_ENV === 'development';

/**
 * Utility types
 */

export type Nullable<T> = T | null | undefined;
export type JsonValue = string | number | boolean | null;

/**
 * Utility functions for date formatting and manipulation.
 */
export const formatDate = (date: Date, format = 'YYYY-MM-DD'): string => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  return format
    .replace(/YYYY/g, date.getFullYear().toString())
    .replace(/MM/g, pad(date.getMonth() + 1))
    .replace(/DD/g, pad(date.getDate()))
    .replace(/HH/g, pad(date.getHours()))
    .replace(/mm/g, pad(date.getMinutes()))
    .replace(/ss/g, pad(date.getSeconds()));
};

export const today = new Date();
export const todayDate = formatDate(today, 'YYYYMMDD');
export const todayDateInHyphens = formatDate(today, 'YYYY-MM-DD');
export const todayDateInSlashes = formatDate(today, 'YYYY/MM/DD');

export const yesterday = new Date(today.getTime() - 86400000);
export const yesterdayDate = formatDate(yesterday, 'YYYYMMDD');
export const yesterdayDateInHyphens = formatDate(yesterday, 'YYYY-MM-DD');
export const yesterdayDateInSlashes = formatDate(yesterday, 'YYYY/MM/DD');

/**
 * Utility function to handle file.
 */

export const isFilePathExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

export const ensureDirExists = async (filePath: string): Promise<void> => {
  const dir = path.dirname(filePath);
  if (await isFilePathExists(dir)) {
    return;
  }
  await fs.promises.mkdir(dir, { recursive: true });
};
