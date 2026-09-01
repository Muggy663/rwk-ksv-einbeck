// src/app/api/members/route.ts
// Zentrale, abgesicherte API für die Mitgliederverwaltung (RWK + KM).
// Einziger legitimer Schreibweg für Mitglieder-Stammdaten.
// Autorisierung erfolgt serverseitig maßgeblich über getServerMemberPermissions.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyApiAuth } from '@/lib/auth/api-auth';
import { secureLogger } from '@/lib/utils/secure-logger';
import {
  derivePermissions,
  isClubAllowed,
  type MemberPermissions,
  type PermissionSource,
} from '@/lib/permissions/memberPermissions';

const SHOOTERS = 'shooters';

/**
 * Lädt das user_permissions-Dokument des authentifizierten Nutzers und leitet
 * die maßgeblichen Mitglieder-Rechte ab. Dies ist die serverseitige,
 * verbindliche Rechte-Ermittlung (Task 2.2).
 */
export async function getServerMemberPermissions(
  uid: string,
  email?: string | null
): Promise<MemberPermissions> {
  let data: PermissionSource | null = null;
  try {
    const snap = await adminDb.collection('user_permissions').doc(uid).get();
    if (snap.exists) {
      data = snap.data() as PermissionSource;
    }
  } catch (error) {
    secureLogger.error(
      'Laden der user_permissions fehlgeschlagen',
      error instanceof Error ? error : undefined,
      'api/members'
    );
  }
  return derivePermissions(data, email ?? data?.email ?? null);
}

// Sortierhilfe: nach Nachname, dann Vorname, dann Name.
function memberSortKey(m: any): string {
  return `${(m.lastName || '').toLowerCase()} ${(m.firstName || '').toLowerCase()} ${(
    m.name || ''
  ).toLowerCase()}`.trim();
}

/**
 * GET /api/members
 * Liefert aktive Mitglieder (isActive !== false), rollenbasiert gefiltert.
 * Optional ?clubId=<id> zum Einschränken auf einen erlaubten Verein.
 */
export async function GET(request: NextRequest) {
  const user = await verifyApiAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const perms = await getServerMemberPermissions(user.uid, user.email);
  if (!perms.canViewMembers) {
    return NextResponse.json(
      { success: false, error: 'Keine Berechtigung für die Mitgliederverwaltung' },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const requestedClubId = url.searchParams.get('clubId');

  // Verein aus Query muss erlaubt sein.
  if (requestedClubId && !isClubAllowed(perms, requestedClubId)) {
    return NextResponse.json(
      { success: false, error: 'Kein Zugriff auf diesen Verein' },
      { status: 403 }
    );
  }

  try {
    // Zu ladende Vereins-IDs bestimmen.
    let clubIdsToLoad: string[] | null = null; // null = alle
    if (requestedClubId) {
      clubIdsToLoad = [requestedClubId];
    } else if (!perms.canViewAllClubs) {
      clubIdsToLoad = perms.allowedClubIds;
      if (clubIdsToLoad.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
    }

    const results: any[] = [];

    if (clubIdsToLoad === null) {
      // Alle Vereine (Admin / KM-Orga): komplette Collection, clientseitig gefiltert.
      const snap = await adminDb.collection(SHOOTERS).get();
      snap.forEach((doc) => {
        const d = doc.data();
        if (d.isActive !== false) results.push({ id: doc.id, ...d });
      });
    } else {
      // Nur bestimmte Vereine: Firestore 'in'-Query in Blöcken zu je 10.
      for (let i = 0; i < clubIdsToLoad.length; i += 10) {
        const chunk = clubIdsToLoad.slice(i, i + 10);
        const snap = await adminDb.collection(SHOOTERS).where('clubId', 'in', chunk).get();
        snap.forEach((doc) => {
          const d = doc.data();
          if (d.isActive !== false) results.push({ id: doc.id, ...d });
        });
      }
    }

    results.sort((a, b) => memberSortKey(a).localeCompare(memberSortKey(b), 'de'));

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    secureLogger.error(
      'GET /api/members fehlgeschlagen',
      error instanceof Error ? error : undefined,
      'api/members'
    );
    return NextResponse.json(
      { success: false, error: 'Mitglieder konnten nicht geladen werden' },
      { status: 500 }
    );
  }
}

// Normalisiert einen String-Wert (trim, leere Strings → '').
function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * POST /api/members
 * Legt ein neues Mitglied an. Nur mit canEdit; Sportleiter nur für eigene Vereine.
 * Schreibt ausschließlich clubId als Vereinsfeld.
 */
export async function POST(request: NextRequest) {
  const user = await verifyApiAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const perms = await getServerMemberPermissions(user.uid, user.email);
  if (!perms.canEdit) {
    return NextResponse.json(
      { success: false, error: 'Keine Berechtigung zum Anlegen von Mitgliedern' },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  const firstName = str(body.firstName);
  const lastName = str(body.lastName);
  const clubId = str(body.clubId);
  const genderRaw = str(body.gender);
  const gender = genderRaw === 'male' || genderRaw === 'female' ? genderRaw : 'unknown';
  const birthYear =
    body.birthYear !== undefined && body.birthYear !== null && body.birthYear !== ''
      ? Number(body.birthYear)
      : undefined;

  // Validierung Pflichtfelder.
  if (!firstName || !lastName) {
    return NextResponse.json(
      { success: false, error: 'Vor- und Nachname sind erforderlich' },
      { status: 400 }
    );
  }
  if (!clubId) {
    return NextResponse.json({ success: false, error: 'Verein ist erforderlich' }, { status: 400 });
  }
  if (birthYear !== undefined && (isNaN(birthYear) || birthYear < 1900 || birthYear > 2100)) {
    return NextResponse.json({ success: false, error: 'Ungültiges Geburtsjahr' }, { status: 400 });
  }

  // Vereins-Berechtigung prüfen (Sportleiter nur eigene Vereine).
  if (!isClubAllowed(perms, clubId)) {
    return NextResponse.json(
      { success: false, error: 'Kein Zugriff auf diesen Verein' },
      { status: 403 }
    );
  }

  // Mitgliedsnummer normalisieren (führende Nullen entfernen ist projektweit üblich; hier nur trim).
  const mitgliedsnummer = str(body.mitgliedsnummer);

  const newMember: Record<string, any> = {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    gender,
    clubId,
    isActive: true,
    source: 'manual',
    createdBy: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    teamIds: [],
    // Kontakt-/Stammdaten (optional)
    email: str(body.email),
    telefon: str(body.telefon),
    mobil: str(body.mobil),
    strasse: str(body.strasse),
    plz: str(body.plz),
    ort: str(body.ort),
  };
  if (birthYear !== undefined) newMember.birthYear = birthYear;
  if (mitgliedsnummer) newMember.mitgliedsnummer = mitgliedsnummer;

  try {
    const ref = await adminDb.collection(SHOOTERS).add(newMember);
    return NextResponse.json({ success: true, id: ref.id, data: { id: ref.id, ...newMember } });
  } catch (error) {
    secureLogger.error(
      'POST /api/members fehlgeschlagen',
      error instanceof Error ? error : undefined,
      'api/members'
    );
    return NextResponse.json(
      { success: false, error: 'Mitglied konnte nicht angelegt werden' },
      { status: 500 }
    );
  }
}
