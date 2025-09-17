import { handleApiError, NotFoundError } from '@/lib/next/errors';
import { NextRequest, NextResponse } from 'next/server';
import { locatorTypesType } from '../route';
import Scraper from '@/utilities/WebScraper';
import { Locator } from 'playwright';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const tableSiteUrl = searchParams.get('url');

    const tableLocator = searchParams.get('locator');

    const tableLocatorType = searchParams.get('type') as locatorTypesType;

    const waitForFullLoad = searchParams.get('waitForFullLoad') == '1';

    if (!tableSiteUrl || !tableLocatorType) throw new NotFoundError('Locator or type');

    const scraper = new Scraper();

    try {
      await scraper.init();

      await scraper.navigate(tableSiteUrl);

      if (waitForFullLoad) await scraper.waitForFullLoad();

      let table: Locator | null = null;

      if (tableLocatorType === 'XPATH') {
        table = await scraper.getElementByXPath(tableLocator || '//table');
      } else if (tableLocatorType === 'CSS') {
        table = await scraper.getElementByCss(tableLocator || 'table');
      } else {
        throw new Error('Not implemented yet');
      }

      if (!table) return NextResponse.json(null);

      const tableData = await scraper.extractTableAsArray(table);
      return NextResponse.json(tableData);
    } catch (error) {
      return handleApiError(error);
    } finally {
      await scraper.close();
    }
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: {
      rows: {
        url: string;
        locator: string;
        type: string;
      }[];
    } = await request.json();

    const { rows } = body;

    const scraper = new Scraper();

    await scraper.init();
    try {
      const allTableData = [];

      for (const row of rows) {
        console.log('Processing row', row);

        const { url: tableSiteUrl, locator: tableLocator, type: tableLocatorType } = row;

        await scraper.navigate(tableSiteUrl, { waitUntil: 'domcontentloaded' });

        // if (waitForFullLoad) await scraper.waitForFullLoad();

        let table: Locator | null = null;

        if (tableLocatorType === 'XPATH') {
          table = await scraper.getElementByXPath(tableLocator || '//table');
        } else if (tableLocatorType === 'CSS') {
          table = await scraper.getElementByCss(tableLocator || 'table');
        } else {
          throw new Error('Not implemented yet');
        }

        if (!table) {
          allTableData.push([]);
          continue;
        }

        const tableData = await scraper.extractTableAsArray(table);

        allTableData.push(tableData);
      }

      return NextResponse.json(allTableData);
    } catch (error) {
      return handleApiError(error);
    } finally {
      await scraper.close();
    }
  } catch (error) {
    return handleApiError(error);
  }
}
