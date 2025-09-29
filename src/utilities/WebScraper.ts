import { APIRequestContext, APIResponse, Browser, chromium, Locator, Page } from 'playwright';
import Logger from './Logger';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type waitUntil = 'load' | 'domcontentloaded' | 'networkidle' | 'commit' | undefined;

export type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
  retries?: number;
  returnJson?: boolean;
};

declare global {
  var browser: Browser | undefined;
}

class Scraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private apiContext: APIRequestContext | null = null;
  private logger: Logger | typeof console;

  constructor(logger?: Logger | typeof console) {
    this.logger = logger ?? console;
  }

  async init(headless: boolean = false): Promise<void> {
    let browser = global.browser;
    if (!browser || !browser.isConnected()) {
      browser = global.browser ?? (await chromium.launch({ headless }));
    }

    this.browser = browser;

    global.browser = browser;

    this.page = await this.browser.newPage();

    this.apiContext = await this.browser.newContext().then((c) => c.request);
  }

  private async ensureBrowserInitiation(headless: boolean = false) {
    if (!this.browser || this.browser.isConnected()) {
      const browser = global.browser ?? (await chromium.launch({ headless }));
      this.browser = browser;
      if (process.env.NODE_ENV === 'development') global.browser = browser;
    }

    if (!this.page) {
      this.page = await this.browser.newPage();
    }

    if (!this.apiContext) {
      this.apiContext = await this.browser.newContext().then((c) => c.request);
    }
  }

  async navigate(
    url: string,
    options: {
      waitForFullLoad?: boolean;
      timeout?: number;
      maxRetries?: number;
      waitUntil?: waitUntil;
      referer?: string;
    } = {},
  ): Promise<void> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }

    const { waitForFullLoad = false, timeout = 30000, maxRetries = 2, waitUntil = 'load', referer } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.page.goto(url, { timeout, waitUntil, referer });

        if (waitForFullLoad) {
          await this.waitForFullLoad(timeout);
        }

        this.logger.info(`Navigated to ${url}`);
        return;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = 2000 * (attempt + 1); // Exponential backoff
          this.logger.warn(`Navigation attempt ${attempt + 1} failed. Retrying in ${delay}ms...\n${error}`);

          // Cleanup before retry
          try {
            await this.page?.reload();
          } catch {
            // If reload fails, continue to retry
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to navigate to ${url} after ${maxRetries} retries. Last error: ${lastError?.message}`);
  }

  async waitForFullLoad(timeout = 60000): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    // Combined wait conditions
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded', { timeout }),
      this.page.waitForLoadState('networkidle', { timeout }),
      this.page.waitForFunction(() => document.readyState === 'complete', {
        timeout,
      }),
    ]).catch(() => {
      // Individual failures are acceptable if others succeed
    });

    // Final check
    await this.page.waitForSelector('body', {
      state: 'attached',
      timeout,
    });
  }

  async waitForElement(selector: string, timeout: number = 15000): Promise<Locator> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  async waitForXPath(xpath: string, timeout: number = 15000): Promise<Locator> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }
    const element = this.page.locator(`xpath=${xpath}`);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  async waitForNetworkIdle(timeout: number = 15000): Promise<void> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  async clickElement(element: Locator, scrollIntoElement: boolean = true): Promise<boolean> {
    try {
      if (scrollIntoElement) this.scrollIntoElement(element);
      await element.click();
      return true;
    } catch (error) {
      this.logger.error(`There was an error while clicking the element. ${error}`);
      return false;
    }
  }

  async scrollIntoElement(
    selector: string | Locator,
    options: {
      selectorType?: 'css' | 'xpath';
      behavior?: 'auto' | 'smooth';
      block?: 'start' | 'center' | 'end' | 'nearest';
      inline?: 'start' | 'center' | 'end' | 'nearest';
      timeout?: number;
      maxRetries?: number;
      waitFor?: 'attached' | 'visible';
      offset?: { x?: number; y?: number };
    } = {},
  ): Promise<void> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }

    const {
      selectorType = 'css',
      behavior = 'smooth',
      block = 'center',
      inline = 'nearest',
      timeout = 5000,
      maxRetries = 2,
      waitFor = 'visible',
      offset = { x: 0, y: 0 },
    } = options;

    // Handle both string selectors and Locator objects
    const locator =
      typeof selector === 'string'
        ? this.page.locator(selectorType === 'xpath' ? `xpath=${selector}` : selector).first()
        : selector;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait for element to be ready
        await locator.waitFor({
          state: waitFor,
          timeout,
        });

        // Scroll into view with optional offset
        await locator.evaluate(
          (element, scrollOptions) => {
            // First do standard scrollIntoView
            element.scrollIntoView({
              behavior: scrollOptions.behavior,
              block: scrollOptions.block,
              inline: scrollOptions.inline,
            });

            // Then apply manual offset if needed
            if (scrollOptions.offset.x !== 0 || scrollOptions.offset.y !== 0) {
              const rect = element.getBoundingClientRect();
              window.scrollBy({
                left: scrollOptions.offset.x,
                top: scrollOptions.offset.y || 0 + rect.height, // Account for element height
                behavior: scrollOptions.behavior,
              });
            }
          },
          { behavior, block, inline, offset },
        );

        // Double-check with Playwright's built-in method
        await locator.scrollIntoViewIfNeeded({ timeout });
        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          const delay = 1000 * (attempt + 1);
          this.logger.warn(`Scroll attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to scroll to element after ${maxRetries} attempts: ${lastError?.message}`);
  }

  async getElementByCss(
    cssSelector: string,
    options: {
      timeout?: number;
      throwOnNotFound?: boolean;
      waitFor?: 'attached' | 'visible' | 'hidden';
      from?: Locator;
    } = {},
  ): Promise<Locator | null> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }

    const { timeout = 5000, throwOnNotFound = false, waitFor = 'attached', from = this.page } = options;

    try {
      const locator = from.locator(cssSelector).first();
      await locator.waitFor({
        state: waitFor,
        timeout,
      });
      return locator;
    } catch (error) {
      this.logger.error(`Error in getElementByCss for selector "${cssSelector}": ${error}`);
      if (throwOnNotFound) {
        throw new Error(`Element with CSS selector "${cssSelector}" not found within ${timeout}ms`);
      }
      return null;
    }
  }

  async getElementByXPath(
    xpath: string,
    options: {
      timeout?: number;
      throwOnNotFound?: boolean;
      waitFor?: 'attached' | 'visible' | 'hidden';
      from?: Locator;
    } = {},
  ): Promise<Locator | null> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }

    const { timeout = 5000, throwOnNotFound = false, waitFor = 'attached', from = this.page } = options;

    try {
      const locator = from.locator(`xpath=${xpath}`).first();
      await locator.waitFor({
        state: waitFor,
        timeout,
      });
      return locator;
    } catch (error) {
      this.logger.error(`Error in getElementByXPath for selector "${xpath}": ${error}`);
      if (throwOnNotFound) {
        throw new Error(`Element with XPath "${xpath}" not found within ${timeout}ms`);
      }
      return null;
    }
  }

  async getElementsByCss(cssSelector: string, options?: { timeout?: number; from?: Locator }): Promise<Locator[]> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }
    const parentLocator = options?.from ?? this.page;

    try {
      const locator = parentLocator.locator(cssSelector);
      await locator.first()?.waitFor({
        state: 'attached',
        timeout: options?.timeout ?? 5000,
      });
      return locator.all();
    } catch (error) {
      this.logger.error(`Error in getElementsByCss for selector "${cssSelector}": ${error}`);
      return []; // Return empty array if no elements found
    }
  }

  async getElementsByXPath(xpath: string, options?: { timeout?: number; from?: Locator }): Promise<Locator[]> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }

    const parentLocator = options?.from ?? this.page;

    try {
      const locator = parentLocator.locator(`xpath=${xpath}`);
      await locator.first()?.waitFor({
        state: 'attached',
        timeout: options?.timeout ?? 5000,
      });
      return locator.all();
    } catch (error) {
      this.logger.error(`Error in getElementsByXPath for selector "${xpath}": ${error}`);
      return []; // Return empty array if no elements found
    }
  }

  async getElementByJs(jsPath: string, options?: { timeout?: number }): Promise<Locator | null> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }
    try {
      const val = await this.executeScript<Locator | null>(jsPath);

      if (!val) throw new Error('Element(s) not found by JS path.');

      return val;
    } catch (error) {
      this.logger.info(`Error on getting element by JS. ${error}`);
      return null;
    }
  }

  async getElementText(element: Locator | null): Promise<string | null> {
    if (!element) return null;
    return (await element.textContent())?.trim() || null;
  }

  async getElementAttribute(element: Locator, attribute: string): Promise<string | null> {
    if (!element) return null;
    return (await element?.getAttribute(attribute))?.trim() || null;
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });
  }

  async executeScript<T>(
    script: string | ((arg: unknown) => T | Promise<T>),
    arg?: unknown,
    options: {
      timeout?: number;
      returnByValue?: boolean;
    } = {},
  ): Promise<T> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }

    const { timeout = 30000, returnByValue = true } = options;

    try {
      const pageFn = typeof script === 'function' ? script : (new Function('arg', script) as (arg: unknown) => unknown);

      const result = await this.withTimeout(this.page.evaluateHandle(pageFn, arg), timeout);

      if (returnByValue) {
        const value = await result.jsonValue();
        await result.dispose();
        return value as T;
      }

      return result as unknown as T;
    } catch (error) {
      this.logger.error('Script execution failed', error);
      throw new Error(`Script execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async extractMaxChildren() {
    return await this.executeScript(() => {
      const max = Array.from(document.querySelectorAll('body *')).reduce((max, el) =>
        el.childElementCount > max.childElementCount && !['SELECT', 'SCRIPT'].includes(el.tagName) ? el : max,
      );

      const children = Array.from(max.children);
      const maxGrandChildrenCount = Math.max(...children.map((child) => child.childElementCount));

      return children.map((child) => {
        const grandChildren = Array.from(child.children);
        const row: Record<string, string> = {};

        for (let i = 0; i < maxGrandChildrenCount; i++) {
          const gc = grandChildren[i];
          row[`Column ${i + 1}`] = gc ? gc.textContent.trim() || '(empty)' : '';
        }
        return row;
      });
    });
  }

  async extractTableAsJson(
    tableLocator: Locator,
    options: { hasHeader?: boolean } = {},
  ): Promise<Record<string, string>[]> {
    if (!this.page) {
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }

    const { hasHeader = true } = options;

    // Evaluate inside the browser context
    const tableData = await tableLocator.evaluate(
      (table, opts) => {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length === 0) return [];

        let headers: string[] = [];
        let startRowIndex = 0;

        // If table has headers
        if (opts.hasHeader) {
          const headerCells = Array.from(rows[0].querySelectorAll('th,td'));
          headers = headerCells.map((cell, i) => cell.textContent?.trim() || `column_${i + 1}`);
          startRowIndex = 1;
        } else {
          const firstRowCells = Array.from(rows[0].querySelectorAll('td'));
          headers = firstRowCells.map((_, i) => `column_${i + 1}`);
        }

        const data: Record<string, string>[] = [];

        for (let i = startRowIndex; i < rows.length; i++) {
          const cells = Array.from(rows[i].querySelectorAll('td'));
          if (cells.length === 0) continue;

          const row: Record<string, string> = {};
          headers.forEach((header, idx) => {
            row[header] = cells[idx]?.textContent?.trim() || '';
          });
          data.push(row);
        }

        return data;
      },
      { hasHeader },
    );

    return tableData;
  }

  async extractTableAsArray(
    tableLocator: Locator,
    options: { hasHeader?: boolean } = {},
  ): Promise<{ headers: string[]; rows: string[][] }> {
    if (!this.page) {
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }

    const { hasHeader = true } = options;

    // Evaluate inside the browser context
    const tableData = await tableLocator.evaluate(
      (table, opts) => {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length === 0) {
          return { headers: [], rows: [] };
        }

        let headers: string[] = [];
        let startRowIndex = 0;

        // If table has headers
        if (opts.hasHeader) {
          const headerCells = Array.from(rows[0].querySelectorAll('th,td'));
          headers = headerCells.map((cell, i) => cell.textContent?.trim() || `column_${i + 1}`);
          startRowIndex = 1;
        } else {
          const firstRowCells = Array.from(rows[0].querySelectorAll('td'));
          headers = firstRowCells.map((_, i) => `column_${i + 1}`);
        }

        const data: string[][] = [];

        for (let i = startRowIndex; i < rows.length; i++) {
          const cells = Array.from(rows[i].querySelectorAll('td'));
          if (cells.length === 0) continue;

          data.push(cells.map((cell) => cell.innerText));
        }

        return { headers, rows: data };
      },
      { hasHeader },
    );

    return tableData;
  }

  async waitForElementToDisappear(
    selectorType: 'XPATH' | 'CSS' | 'ID',
    selector: string,
    options: { timeout?: number; maxRetries?: number } = {},
  ): Promise<void> {
    if (!this.page) {
      this.logger.info('Page not found. Initialising...');
      await this.ensureBrowserInitiation();
      if (!this.page) throw new Error('Page not initialised.');
    }
    const { timeout = 10000, maxRetries = 2 } = options;

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const locator = selectorType === 'XPATH' ? this.page.locator(`xpath=${selector}`) : this.page.locator(selector);
        await locator.waitFor({ state: 'detached', timeout });
        return;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          const delay = 1000 * (attempt + 1);
          this.logger.warn(`Wait for disappearance attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        throw new Error(`Element did not disappear after ${maxRetries} attempts: ${lastError?.message}`);
      }
    }
  }

  async inputText(element: Locator, text: string): Promise<void> {
    if (!element) throw new Error('Element is null or undefined');
    await element.fill(text);
  }

  async takeScreenshot() {
    const screenshot = await this.page?.screenshot({ fullPage: true });
    return screenshot;
  }

  private async fetchWithRetry(method: HttpMethod, url: string, options: RequestOptions): Promise<APIResponse> {
    const maxRetries = options.retries ?? 3; // Default 3 retries
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.apiContext!.fetch(url, {
          method,
          headers: options.headers,
          params: options.params,
          data: options.data,
          timeout: options.timeout || 30000,
          failOnStatusCode: true,
        });

        return response;
      } catch (error) {
        lastError = error as Error;

        // Exponential backoff (1000ms, 2000ms, 4000ms)
        if (attempt < maxRetries) {
          this.logger.warn(`Attempt ${attempt + 1} failed: ${lastError.message}. Retrying...`);
          const delayMs = 1000 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw new Error(`Request failed after ${maxRetries} retries: ${lastError?.message}`);
  }

  async get(url: string, options: Omit<RequestOptions, 'data'> = {}): Promise<APIResponse> {
    this.logger.info(`Get request received with ${JSON.stringify(options)}`);

    const { returnJson, ...rest } = options;
    const res = this.fetchWithRetry('GET', url, rest);
    if (returnJson) {
      return await (await res).json();
    }
    return res;
  }

  async post(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    const { returnJson, ...rest } = options;
    const res = this.fetchWithRetry('POST', url, rest);
    if (returnJson) {
      return await (await res).json();
    }
    return res;
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
  }

  async quit(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.page = null;
    }
  }
}

export default Scraper;
