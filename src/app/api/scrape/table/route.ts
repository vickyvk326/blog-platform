import { handleApiError, NotFoundError } from "@/lib/next/errors";
import { NextRequest, NextResponse } from "next/server";
import { locatorTypesType } from "../route";
import Scraper from "@/utilities/WebScraper";
import { Locator } from "playwright";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tableSiteUrl = searchParams.get("url");
    const tableLocator = searchParams.get("locator");
    const tableLocatorType = searchParams.get("type") as locatorTypesType;

    if (!tableSiteUrl || !tableLocator || !tableLocatorType)
      throw new NotFoundError("Locator or type");

    const scraper = new Scraper();

    try {
      await scraper.init();

      await scraper.navigate(tableSiteUrl);

      await scraper.waitForFullLoad();

      let table: Locator | null = null;
      if (tableLocatorType === "XPATH") {
        table = await scraper.getElementByXPath(tableLocator);
      } else if (tableLocatorType === "CSS") {
        table = await scraper.getElementByCss(tableLocator);
      } else {
        throw new Error("Not implemented yet");
      }

      if (!table) return NextResponse.json(null);

      const data = await scraper.extractTableAsJson(table);

      return NextResponse.json(data);
    } catch (error) {
      throw error;
    } finally {
      await scraper.close();
    }
  } catch (error) {
    return handleApiError(error);
  }
}
