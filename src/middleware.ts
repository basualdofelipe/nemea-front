import { auth } from '@/auth';

const ADMIN_ONLY_ROUTES = [
  '/catalogos',
  '/proveedores',
  '/insumos',
  '/productos',
  '/finanzas',
  '/usuarios',
  '/configuracion',
];

function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export const middleware = auth((req) => {
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

  // Role-based routing: non-admin users cannot access admin-only routes
  if (
    req.auth &&
    req.auth.user?.role !== 'admin' &&
    isAdminOnlyRoute(pathname)
  ) {
    return Response.redirect(new URL('/', req.nextUrl.origin));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|fonts|images).*)'],
};
