import { auth } from '@/auth';

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // Unauthenticated users: redirect to /login (except public pages)
  if (!req.auth && pathname !== '/login' && pathname !== '/acceso-denegado') {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return Response.redirect(loginUrl);
  }

  // Authenticated but backend rejected (no backendToken): redirect to /acceso-denegado
  if (
    req.auth &&
    !req.auth.accessToken &&
    pathname !== '/acceso-denegado' &&
    pathname !== '/login'
  ) {
    return Response.redirect(new URL('/acceso-denegado', req.nextUrl.origin));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|fonts|images).*)'],
};
