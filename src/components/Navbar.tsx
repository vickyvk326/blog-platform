'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import Image from 'next/image';

const routes = [
  { href: '/', label: 'Home' },
  { href: '/scraper', label: 'Scraper' },
  { href: '/scraper/flow', label: 'Flow Runner' },
  { href: '/scraper/table', label: 'Table Extractor' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className='fixed inset-x-0 top-0 z-50'>
      <nav
        className='
          mx-auto w-full px-4 sm:px-6 lg:px-8
          py-3
          flex items-center justify-between gap-4
          backdrop-blur-md bg-white/40 dark:bg-gray-900/40
          border-b border-white/10 dark:border-gray-800/40
          shadow-sm
          backdrop-saturate-150
          '
        style={{ WebkitBackdropFilter: 'blur(8px)' }}
      >
        <Image src={'/globe.svg'} alt='logo' width={30} height={30} />
        <div className='flex items-center space-x-4'>
          {routes.map((route) => (
            <Link key={route.href} href={route.href}>
              <Button
                variant={pathname === route.href ? 'default' : 'ghost'}
                className={cn('text-sm font-medium', pathname === route.href && 'bg-primary text-primary-foreground')}
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
