import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith('/trechos') || pathname.startsWith('/vistoria');

  if (isProtected) {
    const sessionCookie = request.cookies.get('ml_vistoria_session');
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/trechos/:path*', '/vistoria/:path*'],
};
