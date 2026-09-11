import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bloqueio de desktop nas rotas /vistoria/* (RFP: PWA-MOBILE-FEATURES-01)
  if (pathname.startsWith('/vistoria')) {
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(userAgent) ||
      request.headers.get('sec-ch-ua-mobile') === '?1';

    // Exceção: PWA instalado em modo standalone (display-mode: standalone)
    const isStandalone =
      request.cookies.get('ml_pwa_standalone')?.value === 'true' ||
      request.nextUrl.searchParams.get('mode') === 'standalone' ||
      request.nextUrl.searchParams.get('display-mode') === 'standalone';

    if (!isMobile && !isStandalone) {
      const blockedUrl = new URL('/desktop-blocked', request.url);
      return NextResponse.redirect(blockedUrl);
    }
  }

  // 2. Proteção de autenticação
  const isProtected =
    pathname.startsWith('/trechos') ||
    pathname.startsWith('/vistoria') ||
    pathname.startsWith('/home');

  if (isProtected) {
    const sessionCookie = request.cookies.get('ml_vistoria_session');
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // Se o request veio com ?mode=standalone, grava o cookie de sessão standalone
  if (
    request.nextUrl.searchParams.get('mode') === 'standalone' ||
    request.nextUrl.searchParams.get('display-mode') === 'standalone'
  ) {
    response.cookies.set('ml_pwa_standalone', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: ['/trechos/:path*', '/vistoria/:path*', '/home/:path*'],
};
