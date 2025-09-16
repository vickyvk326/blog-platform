"use client";

import { locatorTypesType } from "@/app/api/scrape/route";
import { DownloadExcel } from "@/components/scraper/DownloadExcelButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExcelJS from "exceljs";
import { useState } from "react";

type tableData = {
  headers: string[];
  rows: string[][];
};

export default function ScraperPage() {
  const [url, setUrl] = useState("");
  const [locator, setLocator] = useState("");
  const [type, setType] = useState<locatorTypesType>("XPATH");
  const [result, setResult] = useState<{
    type?: "table" | "json";
    data?: tableData[];
    error?: string;
  }>();
  const [loading, setLoading] = useState(false);

  const handlefillSampleLinks = () => {
    setUrl("https://www.scrapethissite.com/pages/forms/");
    setLocator('//*[@id="hockey"]/div/table');
    setType("XPATH");
  };

  const handleSingleSiteScrape = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/scrape/table?url=${encodeURIComponent(url)}&locator=
                ${encodeURIComponent(locator || "//table")}&type=${type}`
      );
      const data: tableData = await res.json();

      setResult({ data: [data], type: "table" });
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to scrape" });
    } finally {
      setLoading(false);
    }
  };

  const [multipleTableInputdata, setMultipleTableInputdata] = useState<{
    headers: string[];
    rows: string[][];
  }>({
    headers: [],
    rows: [],
  });

  const handleMultipleSiteScrape = async () => {
    if (!multipleTableInputdata.rows.length) return;

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rows: multipleTableInputdata.rows.map((row) =>
          Object.fromEntries(
            row.map((cell, idx) => [multipleTableInputdata.headers[idx], cell])
          )
        ),
      }),
    };

    try {
      const res = await fetch(`/api/scrape/table`, requestOptions);
      const data: tableData[] = await res.json();
      setResult({ data, type: "table" });
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to scrape" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer(); // read file into ArrayBuffer
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Get first worksheet (or loop through them)
    const worksheet = workbook.worksheets[0];

    // Extract headers (first row)
    const headerRow = worksheet.getRow(1);
    const headerValues = headerRow.values as (string | null)[];

    // ExcelJS includes an empty element at index 0 → slice it
    setMultipleTableInputdata((input) => ({
      ...input,
      headers: headerValues.slice(1).map((h) => h?.toString() ?? ""),
    }));

    // Extract all rows except header
    const rows: string[][] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const values = row.values as (string | null)[];
      rows.push(values.slice(1).map((v) => v?.toString() ?? ""));
    });

    setMultipleTableInputdata((input) => ({
      ...input,
      rows,
    }));

    console.log("Headers:", headerValues);
    console.log("Rows:", rows);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Table scraper</h1>

      {/* ---- GET form ---- */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account">Single table</TabsTrigger>
          <TabsTrigger value="password">Multiple tables</TabsTrigger>
        </TabsList>

        {/* Single table */}
        <TabsContent value="account">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <h2 className="text-xl font-semibold">Scrape Table (GET)</h2>

              <Button onClick={handlefillSampleLinks} disabled={loading}>
                Try sample site
              </Button>

              <Input
                placeholder="Enter website URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Input
                placeholder="Enter locator (XPath or CSS)"
                value={locator}
                onChange={(e) => setLocator(e.target.value)}
              />

              <Select
                value={type}
                onValueChange={(val: locatorTypesType) => setType(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Locator Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XPATH">XPATH</SelectItem>
                  <SelectItem value="CSS">CSS</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSingleSiteScrape} disabled={loading}>
                {loading ? "Scraping..." : "Scrape Table"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multiple tables */}
        <TabsContent value="password">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <h2 className="text-xl font-semibold">Scrape Multiple tables</h2>

              <DownloadExcel
                buttonText="Download sample input file"
                outputFileName="SampleExcel.xlsx"
                headers={["url", "locator", "type"]}
                rows={[]}
              />

              <InputFile onUpload={handleFileChange} />

              {!!multipleTableInputdata?.headers?.length &&
                !!multipleTableInputdata?.rows?.length && (
                  <>
                    <Button
                      onClick={handleMultipleSiteScrape}
                      disabled={loading}
                    >
                      {loading ? "Scraping..." : "Scrape Table"}
                    </Button>

                    <table className="min-w-full border border-gray-300 rounded-md mt-2">
                      <thead>
                        <tr className="border-b border-gray-200">
                          {multipleTableInputdata?.headers.map((head) => (
                            <th
                              key={head}
                              className="px-3 py-2 border-r border-gray-200 font-bold"
                            >
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {multipleTableInputdata?.rows
                          ?.slice(0, 5)
                          .map((cells, i) => (
                            <tr key={i} className="border-b border-gray-200">
                              {cells.map((cell, j) => (
                                <td
                                  key={j}
                                  className="px-3 py-2 border-r border-gray-200"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    <p className="ps-2.5 font-medium mt-1">
                      {multipleTableInputdata?.rows.length >= 5 &&
                        `${multipleTableInputdata?.rows.length - 5} more rows`}
                    </p>
                  </>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---- Result ---- */}
      <Card>
        <CardContent className="pt-4">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          {!result && <p className="text-muted-foreground">No result yet</p>}

          {result?.error && <p className="text-red-500">{result.error}</p>}

          {/* Table Rendering */}
          {result?.type === "table" &&
            Array.isArray(result.data) &&
            result.data.map((siteTable, idx) => (
              <div className="overflow-x-auto" key={idx}>
                <p className="font-medium">Table {idx + 1} </p>
                <DownloadExcel
                  headers={siteTable?.headers}
                  rows={siteTable?.rows}
                />
                <table className="min-w-full border border-gray-300 rounded-md mt-2">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {siteTable?.headers.map((head) => (
                        <th
                          key={head}
                          className="px-3 py-2 border-r border-gray-200 font-bold"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {siteTable?.rows?.slice(0, 5).map((cells, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        {cells.map((cell, j) => (
                          <td
                            key={j}
                            className="px-3 py-2 border-r border-gray-200"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="ps-2.5 font-medium mt-1">
                  {siteTable?.rows.length >= 5 &&
                    `${siteTable?.rows.length - 5} more rows`}
                </p>
              </div>
            ))}

          {/* JSON fallback */}
          {result?.type === "json" && (
            <pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InputFile({
  onUpload,
}: {
  onUpload: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="grid w-full max-w-sm items-center gap-3">
      <Label htmlFor="picture">Picture</Label>
      <Input id="picture" type="file" onChange={onUpload} />
    </div>
  );
}
