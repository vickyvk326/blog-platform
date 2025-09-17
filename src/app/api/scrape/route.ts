import { AppError, handleApiError, NotFoundError } from '@/lib/next/errors';
import Scraper, { waitUntil } from '@/utilities/WebScraper';
import { NextRequest, NextResponse } from 'next/server';
import { Locator } from 'playwright';

export type locatorTypesType = 'XPATH' | 'CSS' | 'ID' | 'CLASS' | 'JS';

export type locatorType = {
  label: string;
  locator: locatorTypesType;
  value: string;
  attribute?: 'innerText' | 'href' | 'title' | 'src';
  findMany?: boolean;
  timeout?: number;
};

export type scrapeReqBody = Record<string, locatorType[]>;

export type extractedDataType = Record<string, { label: string; data: (string | null)[] }[]>;

export async function POST(req: NextRequest) {
  const scraper = new Scraper();
  try {
    const body: scrapeReqBody = await req.json();

    const searchParams = req.nextUrl.searchParams;

    let wait_until: waitUntil = searchParams.get('waitUntil') as waitUntil;
    if (!wait_until || !['load', 'domcontentloaded', 'networkidle'].includes(wait_until)) wait_until = 'load';

    for (const url of Object.keys(body)) {
      if (!url || !Array.isArray(body[url]) || !body[url].length) throw new NotFoundError('URL or locator');
    }

    await scraper.init();

    const extractedData: extractedDataType = {};

    for (const url of Object.keys(body)) {
      await scraper.navigate(url, { waitUntil: wait_until });

      const elementLocators = body[url];

      for (const elementLocator of elementLocators) {
        const { findMany, attribute, label, timeout = 5000 } = elementLocator;

        console.log(`Processing ${url} of locator`);

        const elements: (Locator | null)[] = [];

        if (elementLocator.locator === 'XPATH') {
          if (!!findMany) {
            elements.push(
              ...(await scraper.getElementsByXPath(elementLocator.value, {
                timeout,
              })),
            );
          } else {
            elements.push(await scraper.getElementByXPath(elementLocator.value, { timeout }));
          }
        } else if (elementLocator.locator === 'CSS') {
          if (!!findMany) {
            elements.push(
              ...(await scraper.getElementsByCss(elementLocator.value, {
                timeout,
              })),
            );
          } else {
            elements.push(await scraper.getElementByCss(elementLocator.value, { timeout }));
          }
        } else if (elementLocator.locator === 'JS') {
          elements.push(await scraper.getElementByJs(elementLocator.value, { timeout }));
        } else {
          throw new AppError('INTERNAL_ERROR', 500, 'Not implemented yet');
        }

        const extractedTexts: string[] = [];
        for (const ele of elements) {
          let data = null;
          if (!!ele) {
            if (!attribute || attribute === 'innerText') {
              data = await scraper.getElementText(ele);
            } else {
              data = await scraper.getElementAttribute(ele, attribute);
            }
          }
          extractedTexts.push(data || 'Not found');
        }

        extractedData[url] = [...(extractedData[url] ?? []), { label, data: extractedTexts }];
      }
    }

    return NextResponse.json({ success: true, data: extractedData });
  } catch (error) {
    return handleApiError(error);
  } finally {
    await scraper.close();
  }
}
