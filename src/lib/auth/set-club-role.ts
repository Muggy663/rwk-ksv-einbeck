// src/lib/auth/set-club-role.ts
// Zentrale, serverseitige Vergabe einer VEREINS-Rolle (Sportleiter/Mannschaftsführer)
// an einen Nutzer. Schreibt exakt dieselben Felder wie das Admin-Benutzerverwaltungs-
// Formular (clubRoles / representedClubs / clubId / emailVerifiedByAdmin) und merged
// mit bestehenden Berechtigungen, damit vorhandene Rechte NICHT verloren gehen.
//
// Nutzt das Admin SDK (adminDb) und ist damit nur serverseitig (API-Routen) verwendbar.
import { adminDb } from '@/lib/firebase/admin';

export type ClubRole = 'SPORTLEITER' | 'MANNSCHAFTSFUEHRER';

export interface SetClubRoleParams {
  uid: string;
  email: string;
  displayName?: string | null;
  clubId: string;
  role: ClubRole;
}

/**
 * Vergibt dem Nutzer die angegebene Vereinsrolle für den angegebenen Verein.
 * Bestehende Vereine/Rollen bleiben erhalten (Merge). Idempotent: erneutes
 * Setzen derselben Rolle ändert nichts Unerwartetes.
 */
export async function setClubRole(params: SetClubRoleParams): Promise<void> {
  const { uid, email, displayName, clubId, role } = params;
  if (!uid || !clubId) throw new Error('uid und clubId sind erforderlich.');

  const ref = adminDb.collection('user_permissions').doc(uid);
  const snap = await ref.get();
  const existing = (snap.exists ? snap.data() : {}) as any;

  // Bestehende Maps/Arrays übernehmen und ergänzen (nicht ersetzen).
  const clubRoles: Record<string, string> = { ...(existing.clubRoles || {}) };
  clubRoles[clubId] = role;

  const representedClubs: string[] = Array.from(
    new Set([...(existing.representedClubs || []), clubId])
  );

  const data = {
    ...existing,
    uid,
    email: email || existing.email || '',
    displayName: displayName ?? existing.displayName ?? null,
    clubRoles,
    representedClubs,
    // Hauptverein nur setzen, wenn noch keiner existiert (ersten beibehalten).
    clubId: existing.clubId || clubId,
    emailVerifiedByAdmin: true,
    emailVerifiedAt: existing.emailVerifiedAt || new Date(),
    updatedAt: new Date(),
  };

  await ref.set(data, { merge: true });
}
