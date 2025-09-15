// src/app/api/auth/check-role/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Diese Konfiguration verhindert die statische Generierung dieser Route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Authentifizierungstoken aus dem Cookie extrahieren
    const authCookie = request.headers.get('cookie')?.split(';')
      .find(c => c.trim().startsWith('firebaseAuth='));
    
    if (!authCookie) {
      return NextResponse.json({ role: null, authenticated: false }, { status: 401 });
    }
    
    // Token aus dem Cookie extrahieren
    const token = authCookie.split('=')[1];
    
    if (!token) {
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
      console.error('Fehler bei der Token-Verifizierung:', error);
      return NextResponse.json({ role: null, authenticated: false }, { status: 401 });
    }
  } catch (error) {
    console.error('Fehler bei der Rollenprüfung:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}