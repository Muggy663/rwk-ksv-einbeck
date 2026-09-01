// src/app/api/members/[id]/route.ts
// PATCH  -> Mitglied aktualisieren (Whitelist, clubId-Berechtigung alt+neu)
// DELETE -> Soft-Delete-Kaskade (isActive=false, aus aktiven Mannschaften entfernen, Audit-Log)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyApiAuth } from '@/lib/auth/api-auth';
import { secureLogger } from '@/lib/utils/secure-logger';
import { getServerMemberPermissions } from '../route';
import { isClubAllowed } from '@/lib/permissions/memberPermissions';

const SHOOTERS = 'shooters';

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

// Erlaubte, editierbare Felder (Whitelist). Vereinswechsel via clubId ist erlaubt,
// wird aber gegen die Rechte geprüft.
const EDITABLE_STRING_FIELDS = [
  'firstName',
  'lastName',
  'clubId',
  'mitgliedsnummer',
  'email',
  'telefon',
  'mobil',
  'strasse',
  'plz',
  'ort',
] as const;

/**
 * PATCH /api/members/[id]
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const user = await verifyApiAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const perms = await getServerMemberPermissions(user.uid, user.email);
  if (!perms.canEdit) {
    return NextResponse.json(
      { success: false, error: 'Keine Berechtigung zum Bearbeiten von Mitgliedern' },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  try {
    const ref = adminDb.collection(SHOOTERS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Mitglied nicht gefunden' }, { status: 404 });
    }
    const existing = snap.data() as any;

    // Zugriff auf den aktuellen Verein prüfen.
    if (!isClubAllowed(perms, existing.clubId)) {
      return NextResponse.json(
        { success: false, error: 'Kein Zugriff auf dieses Mitglied' },
        { status: 403 }
      );
    }

    const update: Record<string, any> = {};

    for (const field of EDITABLE_STRING_FIELDS) {
      if (field in body) update[field] = str(body[field]);
    }

    // Vereinswechsel: auch der Ziel-Verein muss erlaubt sein.
    if ('clubId' in update) {
      if (!update.clubId) {
        return NextResponse.json({ success: false, error: 'Verein ist erforderlich' }, { status: 400 });
      }
      if (!isClubAllowed(perms, update.clubId)) {
        return NextResponse.json(
          { success: false, error: 'Kein Zugriff auf den Ziel-Verein' },
          { status: 403 }
        );
      }
    }

    // Geschlecht (eingeschränkt).
    if ('gender' in body) {
      const g = str(body.gender);
      update.gender = g === 'male' || g === 'female' ? g : 'unknown';
    }

    // Geburtsjahr (validiert).
    if ('birthYear' in body) {
      if (body.birthYear === null || body.birthYear === '') {
        update.birthYear = FieldValue.delete();
      } else {
        const by = Number(body.birthYear);
        if (isNaN(by) || by < 1900 || by > 2100) {
          return NextResponse.json({ success: false, error: 'Ungültiges Geburtsjahr' }, { status: 400 });
        }
        update.birthYear = by;
      }
    }

    // name konsistent halten, wenn Vor-/Nachname geändert wurde.
    const newFirst = 'firstName' in update ? update.firstName : existing.firstName;
    const newLast = 'lastName' in update ? update.lastName : existing.lastName;
    if ('firstName' in update || 'lastName' in update) {
      update.name = `${newFirst || ''} ${newLast || ''}`.trim();
    }

    update.updatedAt = FieldValue.serverTimestamp();

    await ref.update(update);
    const fresh = await ref.get();
    return NextResponse.json({ success: true, data: { id, ...(fresh.data() as any) } });
  } catch (error) {
    secureLogger.error(
      'PATCH /api/members/[id] fehlgeschlagen',
      error instanceof Error ? error : undefined,
      'api/members/[id]'
    );
    return NextResponse.json(
      { success: false, error: 'Mitglied konnte nicht aktualisiert werden' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/members/[id]
 * Soft-Delete mit Kaskade:
 *  - shooters/{id}: isActive=false, deletedAt, deletedBy
 *  - aus aktiven rwk_teams.shooterIds und km_mannschaften.schuetzenIds entfernen
 *  - Ergebnisse/Meldungen bleiben unangetastet
 *  - Audit-Log-Eintrag
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const user = await verifyApiAuth(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  const perms = await getServerMemberPermissions(user.uid, user.email);
  if (!perms.canEdit) {
    return NextResponse.json(
      { success: false, error: 'Keine Berechtigung zum Löschen von Mitgliedern' },
      { status: 403 }
    );
  }

  try {
    const ref = adminDb.collection(SHOOTERS).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Mitglied nicht gefunden' }, { status: 404 });
    }
    const existing = snap.data() as any;

    if (!isClubAllowed(perms, existing.clubId)) {
      return NextResponse.json(
        { success: false, error: 'Kein Zugriff auf dieses Mitglied' },
        { status: 403 }
      );
    }

    // 1) Soft-Delete am Mitglied.
    await ref.update({
      isActive: false,
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: user.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2) Aus aktiven RWK-Teams entfernen.
    const removedFromTeams: string[] = [];
    try {
      const rwkSnap = await adminDb
        .collection('rwk_teams')
        .where('shooterIds', 'array-contains', id)
        .get();
      for (const teamDoc of rwkSnap.docs) {
        await teamDoc.ref.update({ shooterIds: FieldValue.arrayRemove(id) });
        removedFromTeams.push(`rwk_teams/${teamDoc.id}`);
      }
    } catch (e) {
      secureLogger.error(
        'Entfernen aus rwk_teams fehlgeschlagen',
        e instanceof Error ? e : undefined,
        'api/members/[id]'
      );
    }

    // 3) Aus aktiven KM-Mannschaften entfernen.
    try {
      const kmSnap = await adminDb
        .collection('km_mannschaften')
        .where('schuetzenIds', 'array-contains', id)
        .get();
      for (const mDoc of kmSnap.docs) {
        await mDoc.ref.update({ schuetzenIds: FieldValue.arrayRemove(id) });
        removedFromTeams.push(`km_mannschaften/${mDoc.id}`);
      }
    } catch (e) {
      secureLogger.error(
        'Entfernen aus km_mannschaften fehlgeschlagen',
        e instanceof Error ? e : undefined,
        'api/members/[id]'
      );
    }

    // 4) Audit-Log.
    try {
      await adminDb.collection('audit_logs').add({
        action: 'member_soft_delete',
        entity: 'shooters',
        entityId: id,
        memberName: existing.name || `${existing.firstName || ''} ${existing.lastName || ''}`.trim(),
        clubId: existing.clubId || null,
        removedFrom: removedFromTeams,
        performedBy: user.uid,
        performedByEmail: user.email || null,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      secureLogger.error(
        'Audit-Log für Soft-Delete fehlgeschlagen',
        e instanceof Error ? e : undefined,
        'api/members/[id]'
      );
    }

    return NextResponse.json({ success: true, removedFrom: removedFromTeams });
  } catch (error) {
    secureLogger.error(
      'DELETE /api/members/[id] fehlgeschlagen',
      error instanceof Error ? error : undefined,
      'api/members/[id]'
    );
    return NextResponse.json(
      { success: false, error: 'Mitglied konnte nicht gelöscht werden' },
      { status: 500 }
    );
  }
}
