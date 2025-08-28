import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const isAdminRoute = url.pathname.startsWith('/admin');

  const token = req.cookies.get('admin_token')?.value;
  const validToken = process.env.ADMIN_TOKEN;

  if (isAdminRoute && token !== validToken) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
