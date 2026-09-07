// src/app/api/cron/meldeschluss-reminder/route.ts
// Täglicher Cron (Vercel): verschickt einmalig eine Erinnerungs-E-Mail an
// Sportleiter und KM-Orga, wenn ein Meldeschluss (RWK oder KM) in ~7 Tagen liegt.
// Absicherung über CRON_SECRET (Vercel sendet automatisch Authorization: Bearer $CRON_SECRET).
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { parseMeldeschluss } from '@/lib/utils/km-meldeschluss';
import { logError, logInfo } from '@/lib/utils/secure-logger';

// Fenster: an welchen Tagen vor dem Meldeschluss erinnert wird.
// 7 Tage ist das Ziel; 5–8 Tage als Puffer, falls der Cron einen Tag ausfällt.
// Da pro Saison nur EINMAL gesendet wird (Flag), gibt es keine Doppelmails.
const REMINDER_MIN_DAYS = 5;
const REMINDER_MAX_DAYS = 8;
const REMINDER_TARGET_DAYS = 7;

const REMINDERS_COLLECTION = 'meldeschluss_reminders';
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || 'RWK Einbeck <noreply@rwk-einbeck.de>';
const RESEND_REPLY_TO = 'rwk-leiter-ksve@gmx.de';

interface Empfaenger {
  email: string;
  name: string;
}

interface SaisonReminder {
  key: string;          // stabiler Schlüssel für das "gesendet"-Flag
  bereich: 'RWK' | 'KM';
  titel: string;
  deadline: Date;
  href: string;
}

/**
 * Lädt alle Nutzer mit Rolle Sportleiter oder KM-Orga aus user_permissions.
 * Rollen-Ableitung analog src/lib/permissions/memberPermissions.ts.
 */
async function ladeEmpfaenger(): Promise<Empfaenger[]> {
  const snap = await adminDb.collection('user_permissions').get();
  const map = new Map<string, Empfaenger>();

  snap.docs.forEach((doc) => {
    const u = doc.data() as any;
    const email: string | undefined = u.email;
    if (!email || typeof email !== 'string') return;
    if (u.isActive === false) return;

    const clubRoles = u.clubRoles ? Object.values(u.clubRoles as Record<string, string>) : [];
    const kvRoles = u.kvRoles ? Object.values(u.kvRoles as Record<string, string>) : [];

    const isSportleiter = clubRoles.includes('SPORTLEITER');
    const isKmOrga =
      kvRoles.includes('KV_KM_ORGA') ||
      kvRoles.includes('KV_WETTKAMPFLEITER') ||
      u.role === 'km_organisator' ||
      u.role === 'km_orga' ||
      email.toLowerCase() === 'stephanie.buenger@gmx.de';

    if (isSportleiter || isKmOrga) {
      const lower = email.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, { email, name: u.displayName || email });
      }
    }
  });

  return Array.from(map.values());
}

/**
 * Sammelt RWK- und KM-Saisons, deren Meldeschluss im Erinnerungsfenster liegt.
 */
async function ladeFaelligeSaisons(jetzt: Date): Promise<SaisonReminder[]> {
  const result: SaisonReminder[] = [];

  const pruefe = (
    key: string,
    bereich: 'RWK' | 'KM',
    titel: string,
    meldeschluss: string | undefined | null,
    href: string
  ) => {
    const deadline = parseMeldeschluss(meldeschluss);
    if (!deadline) return;
    // Volle Tage bis zum Meldeschluss (Ende des Meldeschlusstags berücksichtigt der Parser).
    const msBis = deadline.getTime() - jetzt.getTime();
    const tageBis = Math.ceil(msBis / (24 * 60 * 60 * 1000));
    if (tageBis >= REMINDER_MIN_DAYS && tageBis <= REMINDER_MAX_DAYS) {
      result.push({ key, bereich, titel, deadline, href });
    }
  };

  // RWK-Saisons (Collection 'seasons') mit Status "Anmeldung möglich"
  try {
    const rwkSnap = await adminDb
      .collection('seasons')
      .where('status', '==', 'Anmeldung möglich')
      .get();
    rwkSnap.docs.forEach((d) => {
      const s = d.data() as any;
      pruefe(`rwk_${d.id}`, 'RWK', s.name || 'Rundenwettkampf', s.meldeschluss, '/verein/mannschaften');
    });
  } catch (error) {
    logError('Cron Meldeschluss: RWK-Saisons konnten nicht geladen werden', error);
  }

  // KM-Saisons (Collection 'km_saisons')
  try {
    const kmSnap = await adminDb.collection('km_saisons').get();
    kmSnap.docs.forEach((d) => {
      const s = d.data() as any;
      pruefe(`km_${d.id}`, 'KM', s.name || 'Kreismeisterschaft', s.meldeschluss, '/km/meldungen');
    });
  } catch (error) {
    logError('Cron Meldeschluss: KM-Saisons konnten nicht geladen werden', error);
  }

  return result;
}

function formatDatum(d: Date): string {
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Berlin',
  });
}

export async function GET(request: NextRequest) {
  // Absicherung: nur mit gültigem CRON_SECRET aufrufbar
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    logError('Cron Meldeschluss: RESEND_API_KEY fehlt');
    return NextResponse.json({ success: false, error: 'RESEND_API_KEY fehlt' }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const jetzt = new Date();

  try {
    const faellige = await ladeFaelligeSaisons(jetzt);
    if (faellige.length === 0) {
      logInfo('Cron Meldeschluss: keine fälligen Saisons im Erinnerungsfenster');
      return NextResponse.json({ success: true, sent: 0, message: 'Keine fälligen Meldeschlüsse.' });
    }

    // Bereits versendete Erinnerungen herausfiltern (einmalig pro Saison)
    const offene: SaisonReminder[] = [];
    for (const s of faellige) {
      const flagRef = adminDb.collection(REMINDERS_COLLECTION).doc(s.key);
      const flagSnap = await flagRef.get();
      if (!flagSnap.exists) offene.push(s);
    }

    if (offene.length === 0) {
      logInfo('Cron Meldeschluss: alle fälligen Erinnerungen bereits versendet');
      return NextResponse.json({ success: true, sent: 0, message: 'Bereits erinnert.' });
    }

    const empfaenger = await ladeEmpfaenger();
    if (empfaenger.length === 0) {
      logInfo('Cron Meldeschluss: keine Empfänger (Sportleiter/KM-Orga) gefunden');
      return NextResponse.json({ success: true, sent: 0, message: 'Keine Empfänger.' });
    }

    let versendet = 0;

    for (const s of offene) {
      const betreff = `⏰ Erinnerung: Meldeschluss ${s.bereich} am ${formatDatum(s.deadline)}`;
      const text =
        `Hallo,\r\n\r\n` +
        `dies ist eine automatische Erinnerung: Der Meldeschluss für "${s.titel}" (${s.bereich}) ` +
        `ist in etwa ${REMINDER_TARGET_DAYS} Tagen.\r\n\r\n` +
        `Meldeschluss: ${formatDatum(s.deadline)}\r\n` +
        `Bereich: ${s.bereich === 'RWK' ? 'Rundenwettkampf' : 'Kreismeisterschaft'}\r\n\r\n` +
        `Bitte denke daran, deine Meldungen rechtzeitig einzutragen:\r\n` +
        `https://rwk-einbeck.de${s.href}\r\n\r\n` +
        `Diese E-Mail geht an alle Sportleiter und die KM-Organisation.`;
      const html = text.replace(/\r\n/g, '<br>');

      // Versand in Batches à 25 (Resend-Limit / gute Praxis)
      const batchSize = 25;
      let saisonErfolg = true;
      for (let i = 0; i < empfaenger.length; i += batchSize) {
        const batch = empfaenger.slice(i, i + batchSize);
        try {
          await resend.emails.send({
            from: RESEND_FROM,
            to: batch.map((e) => e.email),
            subject: betreff,
            text,
            html,
            replyTo: RESEND_REPLY_TO,
          });
        } catch (mailErr) {
          saisonErfolg = false;
          logError(`Cron Meldeschluss: Versand-Batch fehlgeschlagen (${s.key})`, mailErr);
        }
      }

      // "Gesendet"-Flag nur setzen, wenn der Versand erfolgreich war,
      // damit bei einem Fehler am Folgetag erneut versucht wird.
      if (saisonErfolg) {
        await adminDb.collection(REMINDERS_COLLECTION).doc(s.key).set({
          key: s.key,
          bereich: s.bereich,
          titel: s.titel,
          meldeschluss: formatDatum(s.deadline),
          empfaengerAnzahl: empfaenger.length,
          gesendetAm: FieldValue.serverTimestamp(),
        });
        versendet += 1;
        logInfo(`Cron Meldeschluss: Erinnerung versendet (${s.key}) an ${empfaenger.length} Empfänger`);
      }
    }

    return NextResponse.json({
      success: true,
      sent: versendet,
      recipients: empfaenger.length,
      message: `${versendet} Erinnerung(en) versendet.`,
    });
  } catch (error) {
    logError('Cron Meldeschluss: unerwarteter Fehler', error);
    return NextResponse.json({ success: false, error: 'Interner Fehler' }, { status: 500 });
  }
}
