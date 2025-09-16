import Link from "next/link";
export default function Home() {
  return (
    <>
      <h1>Home</h1>
      <div className="flex items-center justify-center">
        <Link href={"/scraper"}>Scrape tables</Link>
      </div>
    </>
  );
}
