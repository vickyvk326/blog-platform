import { handleApiError } from "@/lib/next/errors";
import Scraper, { RequestOptions, waitUntil } from "@/utilities/WebScraper";
import { NextRequest, NextResponse } from "next/server";
import { Locator } from "playwright";

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
  | { getRequest: { url: string; options: Omit<RequestOptions, "data"> } }
  | { postRequest: { url: string; options: RequestOptions } };

export type flowReqBody = {
  steps: flow[];
};

const handleStep = async (
  scraper: Scraper,
  flow: { action: keyof flow; value: unknown },
  prevValue?: unknown,
  stepCounter?: number
) => {
  const { action, value } = flow as {
    action: keyof flow;
    value: flow[keyof flow];
  };
  try {
    switch (action) {
      case "navigateTo":
        const {
          url: naviagteUrl,
          waitUntil = "load",
        }: { url: string; waitUntil: waitUntil } = value;
        await scraper.navigate(naviagteUrl, { waitUntil });
        break;
      case "getElementByXpath":
        return await scraper.getElementByXPath(value);
      case "getElementsByXpath":
        return await scraper.getElementsByXPath(value);
      case "getElementByCss":
        return await scraper.getElementByCss(value);
      case "getElementsByCss":
        return await scraper.getElementsByCss(value);
      case "clickElement":
        await scraper.clickElement(value);
        break;
      case "extractText":
        if (prevValue instanceof Array) {
          return await Promise.all(
            prevValue.map((el: Locator) => scraper.getElementText(el))
          );
        } else if (prevValue) {
          return await scraper.getElementText(prevValue as Locator);
        }
      case "extractTable":
        if (prevValue instanceof Array) {
          return await Promise.all(
            prevValue.map((el: Locator) => scraper.extractTableAsJson(el))
          );
        } else if (prevValue) {
          return await scraper.extractTableAsJson(prevValue as Locator);
        }
      case "extractAttribute":
        if (prevValue instanceof Array) {
          return await Promise.all(
            prevValue.map((el: Locator) =>
              scraper.getElementAttribute(el, value)
            )
          );
        } else if (prevValue) {
          return await scraper.getElementAttribute(prevValue as Locator, value);
        }
        return await scraper.getElementAttribute(prevValue as Locator, value);
      case "waitForFullLoad":
        await scraper.waitForFullLoad(value as number);
        break;
      case "screenshot":
        const screenshotData = await scraper.takeScreenshot();
        return screenshotData;
      case "executeJavaScript":
        await scraper.executeScript(value);
        break;
      case "inputText":
        await scraper.inputText(prevValue as Locator, value);
        break;
      case "waitForXpathToDisappear":
        await scraper.waitForElementToDisappear("XPATH", value);
        break;
      case "waitForCSSToDisappear":
        await scraper.waitForElementToDisappear("CSS", value);
        break;
      case "scrollToTop":
        await scraper.executeScript("window.scrollTo(0, 0);");
        break;
      case "scrollToBottom":
        await scraper.executeScript(
          "window.scrollTo(0, document.body.scrollHeight);"
        );
        break;
      case "scrollIntoElement":
        await scraper.scrollIntoElement(prevValue as Locator);
        break;
      case "getRequest":
        const {
          url: getUrl,
          options = {},
        }: { url: string; options?: Omit<RequestOptions, "data"> } = value;
        return await scraper.get(getUrl, options);
      case "postRequest":
        const {
          url: postUrl,
          options: postOptions = {},
        }: { url: string; options?: RequestOptions } = value;
        return await scraper.post(postUrl, postOptions);
      case "default":
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    throw new Error(
      `Processing step ${stepCounter}. ${action}: ${error}`
    );
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

      const stepKey = Object.keys(step)[0];

      const action = stepKey as keyof flow;

      const value = step[stepKey as keyof flow];

      console.log(
        `Processing step ${stepCounter}. ${action} with value: ${value}`
      );

      const flow = { action, value };

      const result = await handleStep(scraper, flow, lastResult, stepCounter);

      lastResult = result;

      const shouldStoreResult = [
        "extractText",
        "extractTable",
        "extractAttribute",
        "screenshot",
        "getRequest",
        "postRequest",
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
