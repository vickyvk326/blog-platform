"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import Image from "next/image";

const routes = [
  { href: "/", label: "Home" },
  { href: "/scraper", label: "Scraper" },
  { href: "/scraper/flow", label: "Flow Runner" },
  { href: "/scraper/table", label: "Table Extractor" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-background">
      <nav className="container flex items-center justify-between h-14">
        <Image src={'/globe.svg'} alt="logo" width={30} height={30} />
        <div className="flex items-center space-x-4">
          {routes.map((route) => (
            <Link key={route.href} href={route.href}>
              <Button
                variant={pathname === route.href ? "default" : "ghost"}
                className={cn(
                  "text-sm font-medium",
                  pathname === route.href &&
                    "bg-primary text-primary-foreground"
                )}
              >
                {route.label}
              </Button>
            </Link>
          ))}
        </div>
        <ThemeToggle />
      </nav>
    </header>
  );
}
