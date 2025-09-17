import { Action, labelledAction } from '@/constants/scraper/flow';
import { handleApiError } from '@/lib/next/errors';
import Scraper, { RequestOptions, waitUntil } from '@/utilities/WebScraper';
import { NextRequest, NextResponse } from 'next/server';
import { Locator } from 'playwright';

export type flow =
  | { navigateTo: { url: string; waitUntil?: string } }
  | { getElementByXpath: string }
  | { getElementsByXpath: string }
  | { getElementByCss: string }
  | { getElementsByCss: string }
  | { clickElement: null }
  | { extractText: null }
  | { extractTable: null }
  | { extractAttribute: string }
  | { waitForPageLoad: number }
  | { waitForFullLoad: number }
  | { screenshot: null }
  | { executeJavaScript: string }
  | { inputText: string }
  | { waitForXpathToDisappear: string }
  | { waitForCssToDisappear: string }
  | { scrollToBottom: null }
  | { scrollIntoElement: null }
  | { getRequest: { url: string; options: Omit<RequestOptions, 'data'> } }
  | { postRequest: { url: string; options: RequestOptions } };

export type flowReqBody = {
  steps: labelledAction[];
};

const handleStep = async (
  scraper: Scraper,
  flow: { action: Action; value: unknown },
  prevValue?: unknown,
  stepCounter?: number,
) => {
  const { action, value } = flow as {
    action: Action;
    value: flow[keyof flow];
  };
  try {
    switch (action) {
      case 'navigateTo':
        const {
          url: naviagteUrl,
          waitUntil = 'load',
          timeout = 5,
        }: { url: string; waitUntil: waitUntil; timeout?: number } = value;
        await scraper.navigate(naviagteUrl, {
          waitUntil,
          timeout: timeout * 1000,
        });
        break;
      case 'findElement':
        const {
          by,
          locator,
          timeout: findElementTimeout = 10,
          multiple = false,
        } = value as {
          by: 'xpath' | 'css' | 'id';
          locator: string;
          timeout?: number;
          multiple?: boolean;
        };
        if (!multiple) {
          if (by === 'xpath') return await scraper.getElementByXPath(locator, { timeout: findElementTimeout * 1000 });
          else if (by === 'css') return await scraper.getElementByCss(locator, { timeout: findElementTimeout * 1000 });
          else if (by === 'id') throw new Error('Finding element by ID is not supported yet');
        } else {
          if (by === 'xpath') return await scraper.getElementByXPath(locator, { timeout: findElementTimeout * 1000 });
          else if (by === 'css') return await scraper.getElementByCss(locator, { timeout: findElementTimeout * 1000 });
          else if (by === 'id') throw new Error('Finding element by ID is not supported yet');
        }
      case 'clickElement':
        await scraper.clickElement(value);
        break;
      case 'extractText':
        if (prevValue instanceof Array) {
          return await Promise.all(prevValue.map((el: Locator) => scraper.getElementText(el)));
        } else if (prevValue) {
          return await scraper.getElementText(prevValue as Locator);
        }
      case 'extractTable':
        if (prevValue instanceof Array) {
          return await Promise.all(prevValue.map((el: Locator) => scraper.extractTableAsJson(el)));
        } else if (prevValue) {
          return [await scraper.extractTableAsJson(prevValue as Locator)];
        }
      case 'extractAttribute':
        if (prevValue instanceof Array) {
          return await Promise.all(prevValue.map((el: Locator) => scraper.getElementAttribute(el, value)));
        } else if (prevValue) {
          return await scraper.getElementAttribute(prevValue as Locator, value);
        }
        return await scraper.getElementAttribute(prevValue as Locator, value);
      case 'waitForFullLoad':
        await scraper.waitForFullLoad(value as number);
        break;
      case 'screenshot':
        const screenshotData = await scraper.takeScreenshot();
        return screenshotData;
      case 'executeJavaScript':
        await scraper.executeScript(value);
        break;
      case 'inputText':
        await scraper.inputText(prevValue as Locator, value);
        break;
      case 'waitForXpathToDisappear':
        await scraper.waitForElementToDisappear('XPATH', value);
        break;
      case 'waitForCssToDisappear':
        await scraper.waitForElementToDisappear('CSS', value);
        break;
      case 'scrollToTop':
        await scraper.executeScript('window.scrollTo(0, 0);');
        break;
      case 'scrollToBottom':
        await scraper.executeScript('window.scrollTo(0, document.body.scrollHeight);');
        break;
      case 'scrollIntoElement':
        await scraper.scrollIntoElement(prevValue as Locator);
        break;
      case 'getRequest':
        const { url: getUrl, options = {} } = value as { url: string; options?: Omit<RequestOptions, 'data'> };
        return await scraper.get(getUrl, options);
      case 'postRequest':
        const { url: postUrl, options: postOptions = {} }: { url: string; options?: RequestOptions } = value as {
          url: string;
          options?: RequestOptions;
        };
        return await scraper.post(postUrl, postOptions);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    throw new Error(`Processing step ${stepCounter}. ${action}: ${error}`);
  }
};

export async function POST(request: NextRequest) {
  const scraper = new Scraper();
  let stepCounter = 0;
  try {
    const automationFlows: flowReqBody = await request.json();

    await scraper.init();

    const results = [];
    let lastResult: unknown = null;

    for (const step of automationFlows.steps) {
      stepCounter++;

      const action = step.action;

      const value = step.data;

      console.log(`Processing step ${stepCounter}. ${step.label} with value: ${JSON.stringify(value)}`);

      const flow = { action, value };

      const result = await handleStep(scraper, flow, lastResult, stepCounter);

      if (!!result) lastResult = result;

      const shouldStoreResult = [
        'extractText',
        'extractTable',
        'extractAttribute',
        'screenshot',
        'getRequest',
        'postRequest',
      ].includes(action);

      results.push({ step, ...(shouldStoreResult && { result }) });
    }
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return handleApiError(error);
  } finally {
    await scraper.close();
  }
}
