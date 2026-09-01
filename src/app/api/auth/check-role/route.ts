// src/app/api/auth/check-role/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput } from '@/lib/utils/input-validator';

// Diese Konfiguration verhindert die statische Generierung dieser Route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Sichere Cookie-Extraktion mit Validierung
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader || typeof cookieHeader !== 'string') {
      secureLogger.warn('Missing or invalid cookie header', 'auth-check');
      return NextResponse.json({ role: null, authenticated: false }, { status: 401 });
    }
    
    const authCookie = cookieHeader.split(';')
      .find(c => c.trim().startsWith('firebaseAuth='));
    
    if (!authCookie) {
      secureLogger.warn('Firebase auth cookie not found', 'auth-check');
      return NextResponse.json({ role: null, authenticated: false }, { status: 401 });
    }
    
    // Sichere Token-Extraktion mit Validierung
    const tokenParts = authCookie.split('=');
    if (tokenParts.length !== 2) {
      secureLogger.warn('Invalid cookie format', 'auth-check');
      return NextResponse.json({ role: null, authenticated: false }, { status: 401 });
    }
    
    const token = sanitizeInput(tokenParts[1]);
    if (!token || token.length < 10) {
      secureLogger.warn('Invalid or missing token', 'auth-check');
      return NextResponse.json({ role: null, authenticated: false }, { status: 401 });
    }
    
    try {
      // Token verifizieren mit Admin SDK
      const admin = await import('firebase-admin/auth');
      const decodedToken = await admin.getAuth().verifyIdToken(token);
      const uid = decodedToken.uid;
      
      // Benutzerberechtigungen aus Firestore laden
      const userPermissionsDoc = await adminDb.collection('user_permissions').doc(uid).get();
      
      if (!userPermissionsDoc.exists) {
        return NextResponse.json({ role: null, authenticated: true }, { status: 200 });
      }
      
      const userPermissions = userPermissionsDoc.data();
      
      return NextResponse.json({
        role: userPermissions?.role || null,
        clubId: userPermissions?.clubId || null,
        authenticated: true
      }, { status: 200 });
    } catch (error) {
      secureLogger.error('Token verification failed', undefined, 'auth-check');
      return NextResponse.json({ role: null, authenticated: false }, { status: 401 });
    }
  } catch (error) {
    secureLogger.error('Role check failed', undefined, 'auth-check');
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
