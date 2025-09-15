// src/lib/services/km-disziplinen-service.ts
import { adminDb } from '@/lib/firebase/admin';

// Altersklassen-Definitionen
export const ALTERSKLASSEN = [
  'Schüler',
  'Jugend', 
  'Junioren',
  'Erwachsene',
  'Senioren'
] as const;

export type Altersklasse = typeof ALTERSKLASSEN[number];

const DISZIPLINEN_2026 = [
  // Luftgewehr Freihand
  { 
    spoNummer: '1.10', 
    name: 'Luftgewehr', 
    nurVereinsmeisterschaft: false, 
    auflage: false,
    schusszahlen: [
      { schusszahl: 20, altersklassen: ['Schüler'], schiesszeit_zuganlagen: 35, schiesszeit_andere: 30 },
      { schusszahl: 40, altersklassen: ['Jugend', 'Junioren', 'Erwachsene', 'Senioren'], schiesszeit_zuganlagen: 60, schiesszeit_andere: 50 }
    ]
  },
  { 
    spoNummer: '1.12', 
    name: '10m Luftgewehr MixTeam', 
    nurVereinsmeisterschaft: false, 
    auflage: false,
    schusszahlen: [
      { schusszahl: 40, altersklassen: ['Alle'], schiesszeit_zuganlagen: 60, schiesszeit_andere: 60 }
    ]
  },
  { 
    spoNummer: '1.20', 
    name: '10m Luftgewehr 3-Stellung', 
    nurVereinsmeisterschaft: true, 
    auflage: false,
    anmerkung: 'Einzelzeiten kn/lg/st incl. Probe/Vorbereitung',
    schusszahlen: [
      { schusszahl: 30, altersklassen: ['Jugend', 'Junioren'], schiesszeit_zuganlagen: 75, schiesszeit_andere: 75 },
      { schusszahl: 60, altersklassen: ['Erwachsene', 'Senioren'], schiesszeit_zuganlagen: 105, schiesszeit_andere: 105 }
    ]
  },
  { 
    spoNummer: '1.30', 
    name: 'Zimmerstutzen', 
    nurVereinsmeisterschaft: false, 
    auflage: false,
    schusszahlen: [
      { schusszahl: 15, altersklassen: ['Schüler', 'Jugend'], schiesszeit_zuganlagen: 30, schiesszeit_andere: 25 },
      { schusszahl: 30, altersklassen: ['Erwachsene', 'Senioren'], schiesszeit_zuganlagen: 45, schiesszeit_andere: 40 }
    ]
  },
  { spoNummer: '1.35', name: 'KK - 100m', nurVereinsmeisterschaft: true, auflage: false, schiesszeit_zuganlagen: 30, schiesszeit_andere: 25 },
  { spoNummer: '1.40', name: 'KK - 3x20 ( 3 Pos )', nurVereinsmeisterschaft: true, auflage: false, schiesszeit_zuganlagen: 70, schiesszeit_andere: 65 },
  { 
    spoNummer: '1.42', 
    name: 'KK - Gewehr 30 Schuss', 
    nurVereinsmeisterschaft: false, 
    auflage: false,
    schusszahlen: [
      { schusszahl: 30, altersklassen: ['Alle'], schiesszeit_zuganlagen: 45, schiesszeit_andere: 40 }
    ]
  },
  { spoNummer: '1.60', name: 'KK - 3x40', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 195, schiesszeit_andere: 165 },
  { spoNummer: '1.80', name: 'KK - Liegendkampf', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 60, schiesszeit_andere: 50 },
  
  // Luftpistole Freihand
  { 
    spoNummer: '2.10', 
    name: '10m Luftpistole', 
    nurVereinsmeisterschaft: false, 
    auflage: false,
    schusszahlen: [
      { schusszahl: 20, altersklassen: ['Schüler'], schiesszeit_zuganlagen: 35, schiesszeit_andere: 30 },
      { schusszahl: 40, altersklassen: ['Jugend', 'Junioren', 'Erwachsene', 'Senioren'], schiesszeit_zuganlagen: 60, schiesszeit_andere: 50 }
    ]
  },
  { spoNummer: '2.12', name: '10m LP MixTeam', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 60, schiesszeit_andere: 60 },
  { spoNummer: '2.17', name: '10m LP Mehrkampf', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 60, schiesszeit_andere: 60 },
  { spoNummer: '2.18', name: '10m LP Standard', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 60, schiesszeit_andere: 60 },
  { spoNummer: '2.20', name: '50m Pistole', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 60, schiesszeit_andere: 60 },
  { spoNummer: '2.30', name: '25m Schnellfeuerpistole', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 60, schiesszeit_andere: 60 },
  { spoNummer: '2.40', name: '25m Pistole', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 60, schiesszeit_andere: 60 },
  { spoNummer: '2.45', name: '25m Zentralfeuerpistole', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 60, schiesszeit_andere: 60 },
  { spoNummer: '2.60', name: '25m Standardpistole', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 60, schiesszeit_andere: 60 },
  
  // Armbrust Freihand (Standard-Schießzeiten, da nicht in der Tabelle)
  { spoNummer: '5.10', name: 'Armbrust 10m', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 60, schiesszeit_andere: 60 },
  { spoNummer: '5.20', name: 'Armbrust 30m', nurVereinsmeisterschaft: false, auflage: false, schiesszeit_zuganlagen: 60, schiesszeit_andere: 60 },
  
  // AUFLAGE-DISZIPLINEN
  { 
    spoNummer: '1.11', 
    name: 'Luftgewehr Auflage', 
    nurVereinsmeisterschaft: false, 
    auflage: true,
    schusszahlen: [
      { schusszahl: 30, altersklassen: ['Alle'], schiesszeit_zuganlagen: 55, schiesszeit_andere: 45 }
    ]
  },
  { spoNummer: '1.19', name: 'Luftgewehr Auflage sitzend', nurVereinsmeisterschaft: false, auflage: true, schiesszeit_zuganlagen: 30, schiesszeit_andere: 25 },
  { spoNummer: '1.31', name: 'Zimmerstutzen Auflage', nurVereinsmeisterschaft: false, auflage: true, schiesszeit_zuganlagen: 25, schiesszeit_andere: 20 },
  { spoNummer: '1.36', name: 'KK Gewehr Auflage 100m', nurVereinsmeisterschaft: false, auflage: true, schiesszeit_zuganlagen: 25, schiesszeit_andere: 20 },
  { spoNummer: '1.39', name: 'KK Gewehr Auflage 100m sitzend', nurVereinsmeisterschaft: false, auflage: true, schiesszeit_zuganlagen: 25, schiesszeit_andere: 20 },
  { 
    spoNummer: '1.41', 
    name: 'KK-Gewehr Auflage 50m', 
    nurVereinsmeisterschaft: false, 
    auflage: true,
    schusszahlen: [
      { schusszahl: 30, altersklassen: ['Alle'], schiesszeit_zuganlagen: 55, schiesszeit_andere: 50 }
    ]
  },
  { spoNummer: '1.43', name: 'KK Gewehr 50 m Zielf. aufgelegt', nurVereinsmeisterschaft: false, auflage: true, schiesszeit_zuganlagen: 40, schiesszeit_andere: 35 },
  { spoNummer: '1.44', name: 'KK Gewehr 100 m Zielf. aufgelegt', nurVereinsmeisterschaft: false, auflage: true, schiesszeit_zuganlagen: 25, schiesszeit_andere: 20 },
  { spoNummer: '1.49', name: 'KK-Gewehr Auflage 50m sitzend', nurVereinsmeisterschaft: false, auflage: true, schiesszeit_zuganlagen: 40, schiesszeit_andere: 35 },
  { spoNummer: '2.11', name: '10 m Luftpistole Auflage', nurVereinsmeisterschaft: false, auflage: true, schiesszeit_zuganlagen: 50, schiesszeit_andere: 50 },
  { spoNummer: '2.21', name: '50 m Freie Pistole Auflage', nurVereinsmeisterschaft: false, auflage: true, schiesszeit_zuganlagen: 50, schiesszeit_andere: 50 },
  { spoNummer: '2.42', name: '25 m Sportpistole Auflage', nurVereinsmeisterschaft: false, auflage: true, schiesszeit_zuganlagen: 50, schiesszeit_andere: 50 },
  { spoNummer: '5.11', name: 'Armbrust 10m Auflage', nurVereinsmeisterschaft: false, auflage: true, schiesszeit_zuganlagen: 50, schiesszeit_andere: 50 },
  
  // Lichtgewehr/Lichtpistole (nur 6-11 Jahre - Vereinsmeisterschaft, kürzere Zeiten)
  { spoNummer: '11.10', name: 'Lichtgewehr', nurVereinsmeisterschaft: true, auflage: false, schiesszeit_zuganlagen: 20, schiesszeit_andere: 20 },
  { spoNummer: '11.11', name: 'Faszination Lichtgewehr', nurVereinsmeisterschaft: true, auflage: false, schiesszeit_zuganlagen: 15, schiesszeit_andere: 15 },
  { spoNummer: '11.20', name: 'Lichtgewehr 3-stellung', nurVereinsmeisterschaft: true, auflage: false, schiesszeit_zuganlagen: 30, schiesszeit_andere: 30 },
  { spoNummer: '11.50', name: 'Lichtpistole', nurVereinsmeisterschaft: true, auflage: false, schiesszeit_zuganlagen: 20, schiesszeit_andere: 20 },
  { spoNummer: '11.51', name: 'Faszination Lichtpistole', nurVereinsmeisterschaft: true, auflage: false, schiesszeit_zuganlagen: 15, schiesszeit_andere: 15 }

];

export async function generateDisziplinen2026(): Promise<void> {
  const collectionRef = adminDb.collection('km_disziplinen');
  
  // Lösche ALLE bestehenden Disziplinen für komplette Neu-Erstellung
  const existingSnapshot = await collectionRef.get();
  
  for (const docSnap of existingSnapshot.docs) {
    await docSnap.ref.delete();
  }
  
  // Erstelle alle Disziplinen neu mit auflage-Flag
  for (const disziplin of DISZIPLINEN_2026) {
    await collectionRef.add({
      ...disziplin,
      saison: '2026',
      createdAt: new Date()
    });
  }
}

export async function getAllDisziplinen() {
  const snapshot = await adminDb.collection('km_disziplinen').get();
  const disziplinen = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Nach SpO-Nummer sortieren
  return disziplinen.sort((a, b) => {
    const aNum = parseFloat(a.spoNummer);
    const bNum = parseFloat(b.spoNummer);
    return aNum - bNum;
  });
}

// Hilfsfunktion: Bestimme Schießzeit basierend auf Altersklasse
export function getSchiesszeit(disziplin: any, altersklasse: string, anlagensystem: 'zuganlagen' | 'andere'): number {
  if (!disziplin?.schusszahlen) {
    // Fallback für alte Disziplinen ohne Schusszahl-System
    return anlagensystem === 'zuganlagen' 
      ? (disziplin?.schiesszeit_zuganlagen || 90)
      : (disziplin?.schiesszeit_andere || 90);
  }
  
  // Finde passende Schusszahl für Altersklasse
  const schusszahlConfig = disziplin.schusszahlen.find((config: any) => 
    config.altersklassen.includes(altersklasse) || config.altersklassen.includes('Alle')
  );
  
  if (!schusszahlConfig) {
    // Fallback: Erste verfügbare Schusszahl
    const fallback = disziplin.schusszahlen[0];
    return anlagensystem === 'zuganlagen' 
      ? fallback.schiesszeit_zuganlagen 
      : fallback.schiesszeit_andere;
  }
  
  return anlagensystem === 'zuganlagen' 
    ? schusszahlConfig.schiesszeit_zuganlagen 
    : schusszahlConfig.schiesszeit_andere;
}