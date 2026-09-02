import { admin } from '@/lib/firebase/admin';
import { secureLogger } from '@/lib/utils/secure-logger';

export async function verifyApiAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    secureLogger.error('Token verification failed', error instanceof Error ? error : undefined, 'api-auth');
    return null;
  }
}

export async function requireAuth(request: Request) {
  const user = await verifyApiAuth(request);
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Authentication required' }), 
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  return user;
}

export async function requireRole(request: Request, allowedRoles: string[]) {
  const user = await verifyApiAuth(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(user.uid)
    .get();
    
  const userRole = userDoc.data()?.role;
  
  if (!allowedRoles.includes(userRole)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  return user;
}

/**
 * Ergebnis der KM-Zugriffsprüfung.
 * Bei ok=false enthält response die passende NextResponse (401/403).
 */
export type KMAuthResult =
  | { ok: true; uid: string; email: string | null }
  | { ok: false; status: number; error: string };

/**
 * Absicherung für KM-Schreib-/Lösch-Routen: verlangt ein gültiges Token und
 * eine KM-relevante Berechtigung (Admin, KM-Orga oder eine Vereinsrolle).
 * Bewusst grob (nicht pro-Verein), aber verhindert anonyme Zugriffe.
 */
export async function requireKMAuth(request: Request): Promise<KMAuthResult> {
  const user = await verifyApiAuth(request);
  if (!user) {
    return { ok: false, status: 401, error: 'Authentication required' };
  }

  const email = (user.email || '').toLowerCase();
  // Admin und KM-Orga sind immer erlaubt.
  if (email === 'admin@rwk-einbeck.de' || email === 'stephanie.buenger@gmx.de') {
    return { ok: true, uid: user.uid, email: user.email ?? null };
  }

  try {
    const snap = await admin.firestore().collection('user_permissions').doc(user.uid).get();
    const data = snap.exists ? (snap.data() as any) : null;
    const hasKMRelevantRole = !!(
      data && (
        data.platformRole === 'SUPER_ADMIN' ||
        data.role === 'km_organisator' ||
        (data.kvRoles && Object.keys(data.kvRoles).length > 0) ||
        (data.clubRoles && Object.keys(data.clubRoles).length > 0) ||
        data.role === 'vereinsvertreter' ||
        data.role === 'mannschaftsfuehrer' ||
        data.role === 'vereinsvorstand'
      )
    );
    if (!hasKMRelevantRole) {
      return { ok: false, status: 403, error: 'Keine Berechtigung für den KM-Bereich' };
    }
  } catch {
    return { ok: false, status: 403, error: 'Berechtigung konnte nicht geprüft werden' };
  }

  return { ok: true, uid: user.uid, email: user.email ?? null };
}
