import { NextResponse, NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] ${request.method} ${request.url}`);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
