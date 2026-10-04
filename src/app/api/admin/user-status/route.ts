// src/app/api/admin/user-status/route.ts
// Liefert den vollständigen Status eines Nutzers (Firebase Auth + Firestore
// user_permissions zusammengeführt) für die Admin-Troubleshooting-Oberfläche.
// Nur für Administratoren.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/api-auth';
import { logError } from '@/lib/utils/secure-logger';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let email: string | undefined;
  try {
    email = (await request.json())?.email?.trim?.().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: 'E-Mail ist erforderlich' }, { status: 400 });
  }

  try {
    // 1. Firebase Auth
    let authUser;
    try {
      authUser = await adminAuth.getUserByEmail(email);
    } catch (e: any) {
      if (e?.code === 'auth/user-not-found' || e?.errorInfo?.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'Kein Nutzer mit dieser E-Mail gefunden.' }, { status: 404 });
      }
      throw e;
    }

    // 2. Firestore user_permissions
    const permSnap = await adminDb.collection('user_permissions').doc(authUser.uid).get();
    const perm = permSnap.exists ? (permSnap.data() as any) : null;

    // 3. Vereinsnamen auflösen (für die Anzeige)
    const clubIds: string[] = perm
      ? Array.from(
          new Set([
            ...(Array.isArray(perm.representedClubs) ? perm.representedClubs : []),
            ...(perm.clubRoles ? Object.keys(perm.clubRoles) : []),
            ...(perm.clubId ? [perm.clubId] : []),
          ])
        )
      : [];
    const clubs: Array<{ id: string; name: string }> = [];
    for (const id of clubIds) {
      try {
        const c = await adminDb.collection('clubs').doc(id).get();
        clubs.push({ id, name: c.exists ? (c.data() as any)?.name || id : id });
      } catch {
        clubs.push({ id, name: id });
      }
    }

    return NextResponse.json({
      found: true,
      auth: {
        uid: authUser.uid,
        email: authUser.email ?? null,
        emailVerified: authUser.emailVerified,
        disabled: authUser.disabled,
        displayName: authUser.displayName ?? null,
        providers: authUser.providerData.map((p) => p.providerId),
        lastSignIn: authUser.metadata.lastSignInTime ?? null,
        created: authUser.metadata.creationTime ?? null,
      },
      permissions: perm
        ? {
            emailVerifiedByAdmin: perm.emailVerifiedByAdmin === true,
            role: perm.role ?? null,
            platformRole: perm.platformRole ?? null,
            kvRole: perm.kvRole ?? (perm.kvRoles ? Object.values(perm.kvRoles)[0] : null) ?? null,
            clubRoles: perm.clubRoles ?? {},
            userType: perm.userType ?? null,
            isActive: perm.isActive !== false,
            displayName: perm.displayName ?? null,
          }
        : null,
      clubs,
    });
  } catch (error: any) {
    logError('user-status fehlgeschlagen:', error);
    return NextResponse.json({ error: 'Status konnte nicht geladen werden.' }, { status: 500 });
  }
}
