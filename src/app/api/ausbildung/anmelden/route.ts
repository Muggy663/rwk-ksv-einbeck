// src/app/api/ausbildung/anmelden/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo, getErrorMessage } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const KURSE_COLLECTION = 'ausbildung_kurse';
const ANMELDUNGEN_COLLECTION = 'ausbildung_anmeldungen';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kursId, vorname, nachname, email, telefon, verein, mitgliedsnummer, anmerkung } = body;

    // Validierung
    if (!kursId || !vorname || !nachname || !email || !verein) {
      return NextResponse.json({ success: false, error: 'Pflichtfelder fehlen' }, { status: 400 });
    }

    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Ungültige E-Mail-Adresse' }, { status: 400 });
    }

    // Kurs laden
    const kursSnap = await adminDb.collection(KURSE_COLLECTION).doc(kursId).get();
    if (!kursSnap.exists) {
      return NextResponse.json({ success: false, error: 'Kurs nicht gefunden' }, { status: 404 });
    }
    const kurs = kursSnap.data() as any;

    // Anmeldeschluss prüfen
    if (kurs.anmeldeschluss && new Date(kurs.anmeldeschluss) < new Date()) {
      return NextResponse.json({ success: false, error: 'Anmeldeschluss ist abgelaufen' }, { status: 400 });
    }

    // Aktuelle Anmeldezahl prüfen
    const anmeldungenSnap = await adminDb.collection(ANMELDUNGEN_COLLECTION)
      .where('kursId', '==', kursId)
      .where('status', 'in', ['angemeldet', 'anwesend'])
      .get();
    const anzahl = anmeldungenSnap.size;
    const istWarteliste = anzahl >= kurs.maxTeilnehmer;

    // Doppelte Anmeldung prüfen
    const duplikatSnap = await adminDb.collection(ANMELDUNGEN_COLLECTION)
      .where('kursId', '==', kursId)
      .where('email', '==', email.toLowerCase())
      .where('status', 'in', ['angemeldet', 'warteliste', 'anwesend'])
      .get();

    if (!duplikatSnap.empty) {
      return NextResponse.json({ success: false, error: 'Du bist bereits für diesen Kurs angemeldet.' }, { status: 409 });
    }

    // Anmeldung speichern
    const anmeldungRef = await adminDb.collection(ANMELDUNGEN_COLLECTION).add({
      kursId,
      kursTitel: kurs.titel,
      vorname: vorname.trim(),
      nachname: nachname.trim(),
      email: email.toLowerCase().trim(),
      telefon: telefon?.trim() || '',
      verein: verein.trim(),
      mitgliedsnummer: mitgliedsnummer?.trim() || '',
      anmerkung: anmerkung?.trim() || '',
      status: istWarteliste ? 'warteliste' : 'angemeldet',
      angemeldetAm: FieldValue.serverTimestamp(),
    });

    logInfo('Neue Anmeldung:', { data: anmeldungRef.id });

    // Datum formatieren
    const datumText = kurs.datumBis
      ? `Sa. ${new Date(kurs.datum).toLocaleDateString('de-DE')} & So. ${new Date(kurs.datumBis).toLocaleDateString('de-DE')}`
      : new Date(kurs.datum).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

    // Bestätigungs-E-Mail an Teilnehmer
    await resend.emails.send({
      from: 'KSV Einbeck Ausbildung <noreply@rwk-einbeck.de>',
      to: email,
      subject: `${istWarteliste ? '[Warteliste] ' : ''}Anmeldung: ${kurs.titel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1f2937; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">🎓 KSV Einbeck – Ausbildung</h1>
          </div>
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p>Hallo ${vorname},</p>
            ${istWarteliste
              ? `<p>du wurdest auf die <strong>Warteliste</strong> für den folgenden Kurs gesetzt. Wir melden uns, sobald ein Platz frei wird.</p>`
              : `<p>deine Anmeldung ist eingegangen. Wir freuen uns auf dich!</p>`
            }
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <h2 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">${kurs.titel}</h2>
              <p style="margin: 4px 0; color: #6b7280;">📅 ${datumText}</p>
              <p style="margin: 4px 0; color: #6b7280;">🕘 ${kurs.startzeit}–${kurs.endzeit} Uhr</p>
              <p style="margin: 4px 0; color: #6b7280;">📍 ${kurs.ort}, ${kurs.adresse}</p>
              <p style="margin: 4px 0; color: #6b7280;">💶 ${kurs.preis === 0 ? 'Kostenlos' : `${kurs.preis} €`}</p>
            </div>
            ${kurs.kategorie === 'jubali' ? `
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin: 16px 0;">
              <p style="margin: 0; font-weight: bold; color: #1d4ed8;">⚠️ Wichtige Hinweise JuBaLi:</p>
              <ul style="margin: 8px 0; color: #1e40af; padding-left: 20px;">
                <li>Erweitertes Führungszeugnis vor Lehrgangsbeginn beantragen und mitbringen</li>
                <li>Erste-Hilfe-Nachweis (nicht älter als 2 Jahre) in Kopie mitbringen</li>
                <li>NSSV Qualifizierungsplan vor dem Lehrgang lesen (Seiten 41 ff.)</li>
              </ul>
            </div>` : ''}
            <p>Bei Fragen erreichst du uns unter: <a href="mailto:rwk-leiter-ksve@gmx.de">rwk-leiter-ksve@gmx.de</a></p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
              KSV Einbeck · Marcel Bünger · rwk-leiter-ksve@gmx.de<br>
              Deine Daten werden nur für die Kursverwaltung verwendet (DSGVO).
            </p>
          </div>
        </div>
      `,
    });

    // Info-E-Mail an Ausbilder
    await resend.emails.send({
      from: 'RWK Einbeck System <noreply@rwk-einbeck.de>',
      to: 'rwk-leiter-ksve@gmx.de',
      subject: `Neue Anmeldung${istWarteliste ? ' (Warteliste)' : ''}: ${kurs.titel}`,
      html: `
        <p><strong>Neue Anmeldung für: ${kurs.titel}</strong></p>
        <p>Name: ${vorname} ${nachname}</p>
        <p>E-Mail: ${email}</p>
        <p>Telefon: ${telefon || '–'}</p>
        <p>Verein: ${verein}</p>
        <p>Mitgliedsnummer: ${mitgliedsnummer || '–'}</p>
        <p>Anmerkung: ${anmerkung || '–'}</p>
        <p>Status: ${istWarteliste ? '⚠️ Warteliste' : '✅ Angemeldet'}</p>
        <p>Anmeldungen gesamt: ${anzahl + 1} / ${kurs.maxTeilnehmer}</p>
      `,
    });

    return NextResponse.json({
      success: true,
      status: istWarteliste ? 'warteliste' : 'angemeldet',
      message: istWarteliste
        ? 'Du wurdest auf die Warteliste gesetzt.'
        : 'Anmeldung erfolgreich! Bestätigung wurde per E-Mail gesendet.',
    });

  } catch (error) {
    logError('Anmeldung Fehler:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
