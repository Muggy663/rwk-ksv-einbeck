// src/lib/services/ausbildung-service.ts
// Service für das Ausbildungsmodul – Kurse & Anmeldungen

import { db } from '@/lib/firebase/config';
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, serverTimestamp
} from 'firebase/firestore';
import { logError, logInfo, getErrorMessage } from '@/lib/utils/secure-logger';

// ─── Typen ───────────────────────────────────────────────────────────────────

export type KursKategorie = 'jubali' | 'luftgewehr' | 'luftpistole' | 'grundlagen' | 'sonstiges';
export type KursStatus = 'offen' | 'ausgebucht' | 'warteliste' | 'abgeschlossen' | 'entwurf';
export type AnmeldungStatus = 'angemeldet' | 'warteliste' | 'storniert' | 'anwesend' | 'abgeschlossen';

export interface Kurs {
  id?: string;
  kursNummer: string;
  titel: string;
  beschreibung: string;
  inhalte: string[];
  datum: string;           // ISO-Datum z.B. "2026-11-28"
  datumBis?: string;       // für mehrtägige Kurse
  startzeit: string;       // "09:00"
  endzeit: string;         // "17:00"
  ort: string;
  adresse: string;
  maxTeilnehmer: number;
  preis: number;           // 0 = kostenlos
  anmeldeschluss: string;
  referenten: string[];
  zielgruppe: string;
  voraussetzungen?: string;
  umfangLE: number;        // Lerneinheiten à 45 Min.
  kategorie: KursKategorie;
  status: KursStatus;
  erstelltAm?: Timestamp;
  aktualisiertAm?: Timestamp;
}

export interface Anmeldung {
  id?: string;
  kursId: string;
  kursTitel: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon?: string;
  verein: string;
  mitgliedsnummer?: string;
  anmerkung?: string;
  status: AnmeldungStatus;
  angemeldetAm: Timestamp;
  userId?: string;         // falls eingeloggt
}

// ─── Kurse ───────────────────────────────────────────────────────────────────

const KURSE_COLLECTION = 'ausbildung_kurse';
const ANMELDUNGEN_COLLECTION = 'ausbildung_anmeldungen';

export async function getKurse(): Promise<Kurs[]> {
  try {
    const snap = await getDocs(
      query(collection(db, KURSE_COLLECTION), orderBy('datum', 'asc'))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Kurs));
  } catch (error) {
    logError('getKurse Fehler:', error);
    return [];
  }
}

export async function getKurs(id: string): Promise<Kurs | null> {
  try {
    const snap = await getDoc(doc(db, KURSE_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Kurs;
  } catch (error) {
    logError('getKurs Fehler:', error);
    return null;
  }
}

export async function createKurs(kurs: Omit<Kurs, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, KURSE_COLLECTION), {
    ...kurs,
    erstelltAm: serverTimestamp(),
    aktualisiertAm: serverTimestamp(),
  });
  logInfo('Kurs erstellt:', { data: ref.id });
  return ref.id;
}

export async function updateKurs(id: string, data: Partial<Kurs>): Promise<void> {
  await updateDoc(doc(db, KURSE_COLLECTION, id), {
    ...data,
    aktualisiertAm: serverTimestamp(),
  });
}

export async function deleteKurs(id: string): Promise<void> {
  await deleteDoc(doc(db, KURSE_COLLECTION, id));
}

// ─── Anmeldungen ─────────────────────────────────────────────────────────────

export async function getAnmeldungenFuerKurs(kursId: string): Promise<Anmeldung[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, ANMELDUNGEN_COLLECTION),
        where('kursId', '==', kursId),
        orderBy('angemeldetAm', 'asc')
      )
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Anmeldung));
  } catch (error) {
    logError('getAnmeldungenFuerKurs Fehler:', error);
    return [];
  }
}

export async function getAnzahlAnmeldungen(kursId: string): Promise<number> {
  try {
    const snap = await getDocs(
      query(
        collection(db, ANMELDUNGEN_COLLECTION),
        where('kursId', '==', kursId),
        where('status', 'in', ['angemeldet', 'anwesend'])
      )
    );
    return snap.size;
  } catch (error) {
    return 0;
  }
}

export async function anmelden(anmeldung: Omit<Anmeldung, 'id' | 'angemeldetAm'>): Promise<string> {
  const ref = await addDoc(collection(db, ANMELDUNGEN_COLLECTION), {
    ...anmeldung,
    angemeldetAm: serverTimestamp(),
  });
  logInfo('Anmeldung erstellt:', { data: ref.id });
  return ref.id;
}

export async function updateAnmeldungStatus(id: string, status: AnmeldungStatus): Promise<void> {
  await updateDoc(doc(db, ANMELDUNGEN_COLLECTION, id), { status });
}

export async function stornieren(id: string): Promise<void> {
  await updateAnmeldungStatus(id, 'storniert');
}

// ─── Hilfsfunktion: Kurs-Status berechnen ────────────────────────────────────

export function berechneKursStatus(kurs: Kurs, anzahlAnmeldungen: number): KursStatus {
  if (kurs.status === 'abgeschlossen' || kurs.status === 'entwurf') return kurs.status;
  if (new Date(kurs.anmeldeschluss) < new Date()) return 'abgeschlossen';
  if (anzahlAnmeldungen >= kurs.maxTeilnehmer) return 'ausgebucht';
  if (anzahlAnmeldungen >= kurs.maxTeilnehmer - 2) return 'warteliste';
  return 'offen';
}
