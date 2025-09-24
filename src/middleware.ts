import { NextResponse, NextRequest } from 'next/server';

const AUTH_ROUTES:string[] = [];

const isAuthRoute = (url: string) => AUTH_ROUTES.some((route) => url.startsWith(route));

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] ${request.method} ${request.nextUrl.pathname}`);

  const token = request.cookies.get('refreshToken')?.value;

  if (!token && isAuthRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url), {
      status: 307,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
