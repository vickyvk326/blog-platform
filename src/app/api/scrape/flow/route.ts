import { Action, labelledAction } from '@/constants/scraper/flow';
import { downloadPDF, runPythonScript } from '@/lib/serverUtils';
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
          if (by === 'xpath') return await scraper.getElementsByXPath(locator, { timeout: findElementTimeout * 1000 });
          else if (by === 'css') return await scraper.getElementsByCss(locator, { timeout: findElementTimeout * 1000 });
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
        return await scraper.executeScript(value);
      case 'inputText':
        await scraper.inputText(prevValue as Locator, value);
        break;
      case 'waitForElementToDisappear':
        const {
          by: selectorType,
          locator: selector,
          options: waitForDisapperOptions = {},
        }: {
          by: 'xpath' | 'css' | 'id';
          locator: string;
          options: { timeout?: number; maxRetries?: number };
        } = value;
        await scraper.waitForElementToDisappear(
          selectorType.toUpperCase() as 'XPATH' | 'CSS' | 'ID',
          selector,
          waitForDisapperOptions,
        );
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
      case 'extractPDF':
        const pythonScript = 'C:\\Users\\User\\Desktop\\react\\blog-platform\\src\\python\\scripts\\playground.py';
        const downloadsPath = 'C:\\Users\\User\\Desktop\\react\\blog-platform\\src\\python\\downloads';

        const { usingUrl, options: pdfOptions } = value;

        let pdfPath = '';
        if (usingUrl) {
          const downloadedPdfPath = await downloadPDF(pdfOptions.url, downloadsPath);
          pdfPath = downloadedPdfPath;
        }

        const args = [pdfPath, pdfOptions.extract];

        const stdOutList = await runPythonScript(pythonScript, args);

        let parsedJson = {};
        if (stdOutList && Array.isArray(stdOutList)) {
          for (const stdOut of stdOutList) {
            const pages = JSON.parse(stdOut);
            parsedJson = { ...parsedJson, ...pages };
          }
        }
        return parsedJson;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    throw new Error(`Processing step ${stepCounter}. ${action}: ${error}`);
  }
};

export type flowResult = {
  step: labelledAction;
  timeTaken: number;
  result?: Awaited<ReturnType<typeof handleStep>>;
  error?: unknown;
};

export async function POST(request: NextRequest) {
  const scraper = new Scraper();
  let stepCounter = 0;
  const results: flowResult[] = [];
  const automationFlows: flowReqBody = await request.json();
  let startTime = null; // or new Date().getTime()
  try {
    await scraper.init();

    let lastResult: unknown = null;
    startTime = Date.now();

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
        'extractPDF',
        'extractAttribute',
        'screenshot',
        'getRequest',
        'postRequest',
        'executeJavaScript',
      ].includes(action);

      const timeTaken = (Date.now() - startTime) / 1000;
      startTime = Date.now();
      results.push({ step, timeTaken, ...(shouldStoreResult && { result }) });
    }
    return NextResponse.json({ success: true, results });
  } catch (error) {
    results.push({
      step: automationFlows.steps[stepCounter - 1],
      timeTaken: Date.now() - (startTime || 1) / 1000,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, results });
  } finally {
    await scraper.close();
  }
}
