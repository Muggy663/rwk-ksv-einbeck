import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Upload Size Limits für bestimmte Pfade
  const uploadPaths = ['/api/upload', '/api/upload-handzettel'];
  const isUploadPath = uploadPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
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
  
  return NextResponse.next();
}

export const config = {
  // Nur API-Routen überwachen, nicht statische Assets
  matcher: '/api/:path*'
};