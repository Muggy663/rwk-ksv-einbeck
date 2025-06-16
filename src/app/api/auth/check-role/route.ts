// src/app/api/auth/check-role/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
      // Token verifizieren
      const decodedToken = await auth.verifyIdToken(token);
      const uid = decodedToken.uid;
      
      // Benutzerberechtigungen aus Firestore laden
      const userPermissionsDoc = await getDoc(doc(db, 'user_permissions', uid));
      
      if (!userPermissionsDoc.exists()) {
        return NextResponse.json({ role: null, authenticated: true }, { status: 200 });
      }
      
      const userPermissions = userPermissionsDoc.data();
      
      return NextResponse.json({
        role: userPermissions.role || null,
        clubId: userPermissions.clubId || null,
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