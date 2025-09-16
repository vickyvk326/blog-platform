"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Types (matches your API route's LocatorType)
export type LocatorTypesType = "XPATH" | "CSS" | "ID" | "CLASS" | "JS";

export type LocatorType = {
  label: string;
  locator: LocatorTypesType;
  value: string;
  attribute?: "innerText" | "href" | "title" | "src";
  findMany?: boolean;
  timeout?: number;
};

type ScrapeInput = {
  url: string;
  locators: LocatorType[];
};

export default function ScraperPage() {
  const [inputs, setInputs] = useState<ScrapeInput[]>([
    {
      url: "",
      locators: [
        {
          label: "",
          locator: "CSS",
          value: "",
          attribute: "innerText",
          findMany: false,
          timeout: 5000,
        },
      ],
    },
  ]);

  const [waitUntil, setWaitUntil] = useState<"load" | "domcontentloaded" | "networkidle">("load");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddUrl = () => {
    setInputs([
      ...inputs,
      {
        url: "",
        locators: [
          {
            label: "",
            locator: "CSS",
            value: "",
            attribute: "innerText",
            findMany: false,
            timeout: 5000,
          },
        ],
      },
    ]);
  };

  const handleRemoveUrl = (idx: number) => {
    setInputs(inputs.filter((_, i) => i !== idx));
  };

  const handleChange = (urlIdx: number, key: keyof ScrapeInput, value: any) => {
    const updated = [...inputs];
    (updated[urlIdx] as any)[key] = value;
    setInputs(updated);
  };

  const handleLocatorChange = (
    urlIdx: number,
    locatorIdx: number,
    key: keyof LocatorType,
    value: any
  ) => {
    const updated = [...inputs];
    updated[urlIdx].locators[locatorIdx] = {
      ...updated[urlIdx].locators[locatorIdx],
      [key]: value,
    };
    setInputs(updated);
  };

  const handleAddLocator = (urlIdx: number) => {
    const updated = [...inputs];
    updated[urlIdx].locators.push({
      label: "",
      locator: "CSS",
      value: "",
      attribute: "innerText",
      findMany: false,
      timeout: 5000,
    });
    setInputs(updated);
  };

  const handleRemoveLocator = (urlIdx: number, locatorIdx: number) => {
    const updated = [...inputs];
    updated[urlIdx].locators = updated[urlIdx].locators.filter((_, i) => i !== locatorIdx);
    setInputs(updated);
  };

  const handleSubmit = async () => {
    setError(null);
    setResult(null);

    const body: Record<string, LocatorType[]> = {};
    for (const input of inputs) {
      const url = input.url?.trim();
      if (!url) continue;

      // Map locators and strip empty locators (optional)
      const mapped = input.locators
        .filter((l) => l && (l.value?.trim() || l.label?.trim()))
        .map((l) => {
          const out: any = { label: l.label || "", locator: l.locator, value: l.value || "" };
          if (l.attribute) out.attribute = l.attribute;
          if (l.findMany) out.findMany = l.findMany;
          if (typeof l.timeout === "number") out.timeout = l.timeout;
          return out as LocatorType;
        });

      if (mapped.length > 0) body[url] = mapped;
    }

    if (Object.keys(body).length === 0) {
      setError("Please provide at least one URL with one locator.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/scrape?waitUntil=${encodeURIComponent(waitUntil)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold">Scraper UI (full LocatorType fields)</h1>

      <Card>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <Label>waitUntil</Label>
            <Select value={waitUntil} onValueChange={(v) => setWaitUntil(v as any)}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="load">load</SelectItem>
                <SelectItem value="domcontentloaded">domcontentloaded</SelectItem>
                <SelectItem value="networkidle">networkidle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div />

          <div className="text-right">
            <Button onClick={handleAddUrl} variant="outline">
              + Add More Website
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {inputs.map((input, urlIdx) => (
          <Card key={urlIdx}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Website {urlIdx + 1}</span>
                <div className="space-x-2">
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveUrl(urlIdx)}>
                    Remove Website
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label>URL</Label>
                <Input
                className="mt-1"
                  placeholder="https://example.com"
                  value={input.url}
                  onChange={(e) => handleChange(urlIdx, "url", e.target.value)}
                />
              </div>

              <div className="space-y-3">
                {input.locators.map((loc, locatorIdx) => (
                  <div key={locatorIdx} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm">Locator {locatorIdx + 1}</Label>
                      <div className="space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveLocator(urlIdx, locatorIdx)}>
                          Remove Locator
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Label</Label>
                        <Input
                        className="mt-1"
                          value={loc.label}
                          onChange={(e) => handleLocatorChange(urlIdx, locatorIdx, "label", e.target.value)}
                          placeholder="Friendly label (eg. Product title)"
                        />
                      </div>

                      <div>
                        <Label>Locator Type</Label>
                        <Select
                          value={loc.locator}
                          onValueChange={(v) => handleLocatorChange(urlIdx, locatorIdx, "locator", v as LocatorTypesType)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="XPATH">XPATH</SelectItem>
                            <SelectItem value="CSS">CSS</SelectItem>
                            <SelectItem value="ID">ID</SelectItem>
                            <SelectItem value="CLASS">CLASS</SelectItem>
                            <SelectItem value="JS">JS</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-2">
                        <Label>Locator Value</Label>
                        <Textarea
                          value={loc.value}
                          onChange={(e) => handleLocatorChange(urlIdx, locatorIdx, "value", e.target.value)}
                          placeholder='e.g. //div[@class="title"] or .product .title'
                        />
                      </div>

                      <div>
                        <Label>Attribute (optional)</Label>
                        <Select
                          value={loc.attribute ?? "innerText"}
                          onValueChange={(v) => handleLocatorChange(urlIdx, locatorIdx, "attribute", v as any)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="innerText">innerText</SelectItem>
                            <SelectItem value="href">href</SelectItem>
                            <SelectItem value="title">title</SelectItem>
                            <SelectItem value="src">src</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs mt-1 text-muted-foreground">If omitted, innerText will be used by your scraper.</p>
                      </div>

                      <div>
                        <Label>Find Many</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            id={`findMany-${urlIdx}-${locatorIdx}`}
                            type="checkbox"
                            checked={!!loc.findMany}
                            onChange={(e) => handleLocatorChange(urlIdx, locatorIdx, "findMany", e.target.checked)}
                          />
                          <Label htmlFor={`findMany-${urlIdx}-${locatorIdx}`} className="mb-0">
                            Return multiple matches
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label>Timeout (ms)</Label>
                        <Input
                        className="mt-1"
                          type="number"
                          min={0}
                          value={loc.timeout}
                          onChange={(e) => handleLocatorChange(urlIdx, locatorIdx, "timeout", Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <Button size="sm" variant="ghost" onClick={() => handleAddLocator(urlIdx)}>
                    + Add Locator
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Scraping..." : "Submit"}
        </Button>

        {error && <div className="text-sm text-rose-600">{error}</div>}
      </div>

      {result && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Result</h2>

          {result?.success ? (
            Object.entries(result.data || {}).map(([url, items]: any) => (
              <Card key={url}>
                <CardHeader>
                  <CardTitle className="text-sm">{url}</CardTitle>
                </CardHeader>
                <CardContent>
                  {items.map((it: any, i: number) => (
                    <div key={i} className="mb-3">
                      <div className="font-medium">{it.label}</div>
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {it.data.map((d: string | null, j: number) => (
                          <div key={j} className="rounded-md border p-2 text-sm">
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          ) : (
            <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded">{JSON.stringify(result, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
