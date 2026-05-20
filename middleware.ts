import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from '@/middleware/security';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Statische Assets explizit ausschließen
  const staticAssets = [
    '/manifest.json',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/_next/',
    '/images/',
    '/icons/'
  ];

  const isStaticAsset = staticAssets.some(asset => pathname.startsWith(asset));
  if (isStaticAsset) {
    return NextResponse.next();
  }

  // Upload Size Limits für bestimmte Pfade
  const uploadPaths = ['/api/upload', '/api/upload-handzettel'];
  const isUploadPath = uploadPaths.some(path => pathname.startsWith(path));

  if (isUploadPath) {
    const contentLength = request.headers.get('content-length');
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (contentLength && parseInt(contentLength) > maxSize) {
      return new Response(
        JSON.stringify({
          error: 'Datei zu groß. Maximum: 50MB',
          maxSize: maxSize
        }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // Security Headers auf alle Responses anwenden
  return securityMiddleware(request);
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)',
};
