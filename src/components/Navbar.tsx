'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './ClientProvider';
import { ThemeToggle } from './theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const routes = [
  { href: '/', label: 'Home' },
  { href: '/scraper', label: 'Scraper' },
  { href: '/scraper/flow', label: 'Flow Runner' },
  { href: '/scraper/table', label: 'Table Extractor' },
];

export default function Navbar() {
  const { user, setUser } = useAuth();
  const pathname = usePathname();
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <header className='fixed inset-x-0 top-0 z-50'>
      <nav
        className='
          mx-auto w-full px-4 sm:px-6 lg:px-8
          py-3
          flex items-center justify-between gap-4
          backdrop-blur-md bg-white/40 dark:bg-gray-900/40
          transition duration-300 ease-in-out
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
        <div className='flex items-center space-x-4'>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>{user.name}</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Button className='w-full' variant={'ghost'}>
                    <Link href={'/profile'}>Profile</Link>
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Button className='w-full' onClick={handleLogout} variant={'destructive'}>
                    Logout
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href={'/login'}>
              <Button
                variant={pathname === '/login' ? 'default' : 'ghost'}
                className={cn('text-sm font-medium', pathname === '/login' && 'bg-primary text-primary-foreground')}
              >
                Login
              </Button>
            </Link>
          )}
        </div>
        <ThemeToggle />
      </nav>
    </header>
  );
}
