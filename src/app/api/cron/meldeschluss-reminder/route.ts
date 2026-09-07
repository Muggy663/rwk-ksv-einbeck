// src/app/api/cron/meldeschluss-reminder/route.ts
// Täglicher Cron (Vercel):
// 1) verschickt einmalig eine Erinnerungs-E-Mail an Sportleiter, Mannschaftsführer
//    und KM-Orga, wenn ein Meldeschluss (RWK oder KM) in ~7 Tagen liegt.
// 2) schließt automatisch das RWK-Meldefenster, wenn der Meldeschluss vorbei ist
//    (Status "Anmeldung möglich" -> "Vorbereitung") und meldet dies dem RWK-Leiter.
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
 * Lädt alle Nutzer mit Rolle Sportleiter, Mannschaftsführer oder KM-Orga
 * aus user_permissions. Rollen-Ableitung analog src/lib/permissions/memberPermissions.ts.
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
    const isMannschaftsfuehrer =
      clubRoles.includes('MANNSCHAFTSFUEHRER') || u.role === 'mannschaftsfuehrer';
    const isKmOrga =
      kvRoles.includes('KV_KM_ORGA') ||
      kvRoles.includes('KV_WETTKAMPFLEITER') ||
      u.role === 'km_organisator' ||
      u.role === 'km_orga' ||
      email.toLowerCase() === 'stephanie.buenger@gmx.de';

    if (isSportleiter || isMannschaftsfuehrer || isKmOrga) {
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

/** HTML-Escaping für Signatur-Text, damit Sonderzeichen sicher dargestellt werden. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Baut Betreff, Plaintext und (ansprechendes) HTML für eine Erinnerungsmail.
 * signature: Freitext-Signatur aus admin_settings/email_signature (optional).
 */
function buildEmail(
  s: SaisonReminder,
  jetzt: Date,
  signature: string
): { subject: string; text: string; html: string } {
  const tageBis = Math.max(1, Math.ceil((s.deadline.getTime() - jetzt.getTime()) / (24 * 60 * 60 * 1000)));
  const bereichLang = s.bereich === 'RWK' ? 'Rundenwettkampf' : 'Kreismeisterschaft';
  const datum = formatDatum(s.deadline);
  const url = `https://rwk-einbeck.de${s.href}`;
  const tageText = tageBis === 1 ? 'morgen' : `in ${tageBis} Tagen`;

  const subject = `⏰ Erinnerung: Meldeschluss ${s.bereich} am ${datum}`;

  const sigText = signature.trim();

  const text =
    `Hallo,\r\n\r\n` +
    `dies ist eine automatische Erinnerung: Der Meldeschluss für "${s.titel}" (${bereichLang}) ist ${tageText}.\r\n\r\n` +
    `Meldeschluss: ${datum}\r\n` +
    `Bereich: ${bereichLang}\r\n\r\n` +
    `Bitte trage deine Meldungen rechtzeitig ein:\r\n${url}\r\n\r\n` +
    `Diese E-Mail geht an alle Sportleiter, Mannschaftsführer und die KM-Organisation.` +
    (sigText ? `\r\n\r\n${sigText}` : '');

  // Signatur als eigener HTML-Block (Freitext → Zeilenumbrüche zu <br>)
  const sigHtml = sigText
    ? `<div style="font-size:13px;color:#64748b;line-height:1.6;margin-top:8px;">${escapeHtml(sigText).replace(/\r?\n/g, '<br>')}</div>`
    : '';

  const badgeFarbe = s.bereich === 'RWK' ? '#1d4ed8' : '#7c3aed';
  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background-color:#0f172a;padding:28px 32px;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;">🎯 RWK Einbeck</div>
            <div style="font-size:13px;color:#94a3b8;margin-top:4px;">Automatische Meldeschluss-Erinnerung</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <span style="display:inline-block;background-color:${badgeFarbe};color:#ffffff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:999px;letter-spacing:0.3px;">${s.bereich} · ${bereichLang}</span>
            <h1 style="font-size:20px;color:#0f172a;margin:16px 0 8px;">Der Meldeschluss ist ${tageText}</h1>
            <p style="font-size:15px;color:#475569;line-height:1.6;margin:0 0 24px;">
              Für <strong style="color:#0f172a;">${s.titel}</strong> läuft die Meldefrist bald ab. Bitte trage deine Meldungen rechtzeitig ein.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
              <tr><td style="padding:16px 20px;">
                <div style="font-size:13px;color:#64748b;">Meldeschluss</div>
                <div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:2px;">${datum}</div>
              </td></tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr><td style="border-radius:8px;background-color:${badgeFarbe};">
                <a href="${url}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Jetzt Meldungen eintragen →</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="font-size:12px;color:#94a3b8;line-height:1.6;margin:0;">
              Diese E-Mail geht automatisch an alle Sportleiter, Mannschaftsführer und die KM-Organisation.
            </p>
            ${sigHtml}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

/**
 * Öffnet automatisch RWK-Meldefenster, deren Meldestart erreicht ist:
 * Status "Vorbereitung" -> "Anmeldung möglich". Informiert den Empfängerkreis
 * (Sportleiter, Mannschaftsführer, KM-Orga) per E-Mail.
 * Gibt die Namen der geöffneten Saisons zurück.
 */
async function oeffneFaelligeRwkFenster(
  jetzt: Date,
  resend: Resend,
  empfaenger: Empfaenger[]
): Promise<string[]> {
  const geoeffnet: string[] = [];
  try {
    const snap = await adminDb
      .collection('seasons')
      .where('status', '==', 'Vorbereitung')
      .get();

    for (const d of snap.docs) {
      const s = d.data() as any;
      const start = parseMeldeschluss(s.meldestart); // parst ISO YYYY-MM-DD (Tagesende)
      // Nur öffnen, wenn ein Meldestart gesetzt und erreicht/überschritten ist.
      if (!start) continue;
      // Öffnen ab dem Meldestart-Tag: sobald "jetzt" den Beginn dieses Tages erreicht.
      const startTagesbeginn = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
      if (jetzt.getTime() < startTagesbeginn.getTime()) continue;

      // Status auf "Anmeldung möglich" setzen -> Meldefenster offen.
      await adminDb.collection('seasons').doc(d.id).update({ status: 'Anmeldung möglich' });

      const name = s.name || 'RWK-Saison';
      geoeffnet.push(name);
      logInfo(`Cron: RWK-Meldefenster geöffnet (${name})`);

      // Info-Mail an den Empfängerkreis
      if (process.env.RESEND_API_KEY && empfaenger.length > 0) {
        const schlussText = s.meldeschluss
          ? `Meldeschluss: ${formatDatum(parseMeldeschluss(s.meldeschluss) || jetzt)}\r\n`
          : '';
        const text =
          `Hallo,\r\n\r\n` +
          `das Meldefenster für "${name}" ist ab heute geöffnet – ihr könnt eure Mannschaften jetzt melden.\r\n\r\n` +
          schlussText +
          `\r\nMeldung eintragen:\r\nhttps://rwk-einbeck.de/verein/mannschaften\r\n\r\n` +
          `Hinweis: Die automatische Öffnung/Schließung der Meldefenster erfolgt täglich gegen 09:00 Uhr.\r\n\r\n` +
          `Diese E-Mail geht an alle Sportleiter, Mannschaftsführer und die KM-Organisation.`;
        const html = text.replace(/\r\n/g, '<br>');
        const batchSize = 25;
        for (let i = 0; i < empfaenger.length; i += batchSize) {
          const batch = empfaenger.slice(i, i + batchSize);
          try {
            await resend.emails.send({
              from: RESEND_FROM,
              to: batch.map((e) => e.email),
              subject: `📣 Meldefenster geöffnet: ${name}`,
              text,
              html,
              replyTo: RESEND_REPLY_TO,
            });
          } catch (mailErr) {
            logError(`Cron Fenster öffnen: Info-Mail-Batch fehlgeschlagen (${d.id})`, mailErr);
          }
        }
      }
    }
  } catch (error) {
    logError('Cron: RWK-Meldefenster öffnen fehlgeschlagen', error);
  }
  return geoeffnet;
}

/**
 * Schließt automatisch RWK-Meldefenster, deren Meldeschluss vorbei ist:
 * Status "Anmeldung möglich" -> "Vorbereitung". Meldet dem RWK-Leiter je
 * geschlossener Saison die Anzahl gemeldeter Mannschaften.
 * Gibt die Namen der geschlossenen Saisons zurück.
 */
async function schliesseAbgelaufeneRwkFenster(jetzt: Date, resend: Resend): Promise<string[]> {
  const geschlossen: string[] = [];
  try {
    const snap = await adminDb
      .collection('seasons')
      .where('status', '==', 'Anmeldung möglich')
      .get();

    for (const d of snap.docs) {
      const s = d.data() as any;
      const deadline = parseMeldeschluss(s.meldeschluss);
      // Nur schließen, wenn ein gültiger Meldeschluss existiert und er vorbei ist.
      if (!deadline || jetzt.getTime() <= deadline.getTime()) continue;

      // Status zurück auf "Vorbereitung" -> Meldefenster ist zu, Anmeldung gesperrt.
      await adminDb.collection('seasons').doc(d.id).update({ status: 'Vorbereitung' });

      // Gemeldete Mannschaften dieser Saison zählen (nur echte Mannschaften, >=3 Schützen)
      let mannschaften = 0;
      try {
        const teamsSnap = await adminDb
          .collection('rwk_teams')
          .where('seasonId', '==', d.id)
          .get();
        mannschaften = teamsSnap.docs.filter((t) => ((t.data() as any).shooterIds?.length || 0) >= 3).length;
      } catch (teamErr) {
        logError(`Cron Fenster schließen: Teams zählen fehlgeschlagen (${d.id})`, teamErr);
      }

      const name = s.name || 'RWK-Saison';
      geschlossen.push(name);
      logInfo(`Cron: RWK-Meldefenster geschlossen (${name}, ${mannschaften} Mannschaften)`);

      // Zusammenfassungs-Mail an den RWK-Leiter
      if (process.env.RESEND_API_KEY) {
        const datum = formatDatum(deadline);
        const text =
          `Das Meldefenster wurde automatisch geschlossen.\r\n\r\n` +
          `Saison: ${name}\r\n` +
          `Meldeschluss: ${datum}\r\n` +
          `Gemeldete Mannschaften: ${mannschaften}\r\n\r\n` +
          `Die Saison steht jetzt wieder auf Status "Vorbereitung" (keine weiteren Meldungen möglich).\r\n` +
          `Nächster Schritt: Mannschaften den Ligen zuordnen und die Saison auf "Laufend" setzen.`;
        try {
          await resend.emails.send({
            from: RESEND_FROM,
            to: [RESEND_REPLY_TO],
            subject: `✅ Meldefenster geschlossen: ${name} (${mannschaften} Mannschaften)`,
            text,
            html: text.replace(/\r\n/g, '<br>'),
            replyTo: RESEND_REPLY_TO,
          });
        } catch (mailErr) {
          logError(`Cron Fenster schließen: Zusammenfassungs-Mail fehlgeschlagen (${d.id})`, mailErr);
        }
      }
    }
  } catch (error) {
    logError('Cron: RWK-Meldefenster schließen fehlgeschlagen', error);
  }
  return geschlossen;
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

  // Empfängerkreis (Sportleiter, Mannschaftsführer, KM-Orga) einmal laden –
  // für Auto-Öffnen-Info und Erinnerungen gleichermaßen genutzt.
  const empfaenger = await ladeEmpfaenger();

  // Aufgabe 2a: fällige RWK-Meldefenster automatisch ÖFFNEN (Meldestart erreicht)
  const geoeffneteFenster = await oeffneFaelligeRwkFenster(jetzt, resend, empfaenger);

  // Aufgabe 2b: abgelaufene RWK-Meldefenster automatisch SCHLIESSEN (Meldeschluss vorbei)
  const geschlosseneFenster = await schliesseAbgelaufeneRwkFenster(jetzt, resend);

  try {
    const faellige = await ladeFaelligeSaisons(jetzt);
    if (faellige.length === 0) {
      logInfo('Cron Meldeschluss: keine fälligen Saisons im Erinnerungsfenster');
      return NextResponse.json({
        success: true,
        sent: 0,
        geoeffnet: geoeffneteFenster,
        geschlossen: geschlosseneFenster,
        message: 'Keine fälligen Meldeschlüsse.',
      });
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
      return NextResponse.json({ success: true, sent: 0, geoeffnet: geoeffneteFenster, geschlossen: geschlosseneFenster, message: 'Bereits erinnert.' });
    }

    if (empfaenger.length === 0) {
      logInfo('Cron Meldeschluss: keine Empfänger (Sportleiter/KM-Orga) gefunden');
      return NextResponse.json({ success: true, sent: 0, geoeffnet: geoeffneteFenster, geschlossen: geschlosseneFenster, message: 'Keine Empfänger.' });
    }

    // Signatur aus admin_settings/email_signature laden (wie beim regulären E-Mail-Versand)
    let signature = '';
    try {
      const sigDoc = await adminDb.collection('admin_settings').doc('email_signature').get();
      if (sigDoc.exists) {
        signature = (sigDoc.data() as any)?.signature || '';
      }
    } catch (sigErr) {
      logError('Cron Meldeschluss: Signatur konnte nicht geladen werden', sigErr);
    }

    let versendet = 0;

    for (const s of offene) {
      const { subject, text, html } = buildEmail(s, jetzt, signature);

      // Versand in Batches à 25 (Resend-Limit / gute Praxis)
      const batchSize = 25;
      let saisonErfolg = true;
      for (let i = 0; i < empfaenger.length; i += batchSize) {
        const batch = empfaenger.slice(i, i + batchSize);
        try {
          await resend.emails.send({
            from: RESEND_FROM,
            to: batch.map((e) => e.email),
            subject,
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
      geoeffnet: geoeffneteFenster,
      geschlossen: geschlosseneFenster,
      message: `${versendet} Erinnerung(en) versendet.`,
    });
  } catch (error) {
    logError('Cron Meldeschluss: unerwarteter Fehler', error);
    return NextResponse.json({ success: false, error: 'Interner Fehler' }, { status: 500 });
  }
}
