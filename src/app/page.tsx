import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="container py-10 space-y-10">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Web Automation Toolkit
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Build and run automation flows, scrape data, and extract structured
          tables — all in one place.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/scraper/flow">
            <Button size="lg">Run a Flow</Button>
          </Link>
          <Link href="/scraper/table">
            <Button size="lg" variant="outline">
              Extract Table
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Scraper</CardTitle>
              <CardDescription>
                Automate browsing & scraping tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Navigate websites, click elements, extract text, run scripts,
                and more.
              </p>
              <Link href="/scraper">
                <Button className="mt-4 w-full">Go to Scraper</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flow Runner</CardTitle>
              <CardDescription>Create step-based automations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Chain actions together like navigation, clicks, form fills, and
                API calls.
              </p>
              <Link href="/scraper/flow">
                <Button className="mt-4 w-full">Run a Flow</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Table Extractor</CardTitle>
              <CardDescription>
                Convert website tables into JSON
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Extract tabular data and view it directly as a structured
                dataset.
              </p>
              <Link href="/scraper/table">
                <Button className="mt-4 w-full">Extract Table</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
