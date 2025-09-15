// src/app/api/km/meldungen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { KMMeldung } from '@/types/km';

const getKMMeldungenCollection = (jahr: number, disziplinKuerzel: string) => `km_meldungen_${jahr}_${disziplinKuerzel.toLowerCase()}`;

// Disziplin-ID zu Kürzel Mapping
const getDisziplinKuerzel = async (disziplinId: string): Promise<string> => {
  try {
    const disziplinDoc = await adminDb.collection('km_disziplinen').doc(disziplinId).get();
    if (disziplinDoc.exists) {
      const disziplin = disziplinDoc.data();
      const name = disziplin?.name?.toLowerCase() || '';
      if (name.includes('kleinkaliber') || name.includes('kk')) return 'kk';
      if (name.includes('luftdruck') || name.includes('ld') || name.includes('luftgewehr') || name.includes('lg') || name.includes('luftpistole') || name.includes('lp')) return 'ld';
    }
  } catch (e) {
    console.warn('Fallback Disziplin-Kürzel:', e);
  }
  return 'ld'; // Fallback
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schuetzeId, disziplinId, lmTeilnahme, anmerkung, vmErgebnis } = body;

    if (!schuetzeId || !disziplinId) {
      return NextResponse.json({
        success: false,
        error: 'Schütze und Disziplin sind erforderlich'
      }, { status: 400 });
    }

    // Hole Benutzerinformationen aus Authorization Header
    const authHeader = request.headers.get('authorization');
    let gemeldeteVon = 'Unbekannter Benutzer';
    
    if (authHeader) {
      try {
        // Vereinfacht - in Produktion würde man den JWT Token validieren
        const userInfo = JSON.parse(authHeader.replace('Bearer ', ''));
        gemeldeteVon = userInfo.email || userInfo.displayName || 'Vereinsvertreter';
      } catch {
        gemeldeteVon = 'Vereinsvertreter';
      }
    }

    // Hole aktuelles Jahr
    let aktivesJahr = 2026; // Fallback
    try {
      const jahreSnapshot = await adminDb.collection('km_jahre').where('status', '==', 'aktiv').get();
      if (!jahreSnapshot.empty) {
        aktivesJahr = jahreSnapshot.docs[0].data().jahr;
      }
    } catch (e) {
      console.warn('Fallback auf Jahr 2026:', e);
    }

    // Hole Disziplin-Kürzel
    const disziplinKuerzel = await getDisziplinKuerzel(disziplinId);

    // Echte Firestore-Speicherung
    const meldung = {
      schuetzeId,
      disziplinId,
      lmTeilnahme: !!lmTeilnahme,
      anmerkung: anmerkung || '',
      saison: aktivesJahr.toString(),
      jahr: aktivesJahr, // Dynamisches Jahr
      meldedatum: new Date(),
      status: 'gemeldet',
      gemeldeteVon,
      vmErgebnis: vmErgebnis || null
    };

    const docRef = await adminDb.collection(getKMMeldungenCollection(aktivesJahr, disziplinKuerzel)).add({
      ...meldung,
      meldedatum: FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...meldung },
      message: 'Meldung erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Fehler beim Erstellen der Meldung:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json({
      success: false,
      error: `Fehler: ${error.message}`,
      details: error.code || 'unknown',
      fullError: error.toString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jahr = parseInt(searchParams.get('jahr') || '2026');
    const clubId = searchParams.get('clubId');
    
    // Alle Disziplinen für ein Jahr laden
    const collections = ['kk', 'ld'];
    let alleMeldungen = [];
    
    console.log('DEBUG: Suche in Jahr:', jahr);
    
    for (const disziplin of collections) {
      try {
        const collectionName = getKMMeldungenCollection(jahr, disziplin);
        console.log('DEBUG: Lade Collection:', collectionName);
        
        const snapshot = await adminDb.collection(collectionName).get();
        
        console.log(`DEBUG: Collection ${collectionName} hat ${snapshot.docs.length} Dokumente`);
        
        const meldungen = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          _collection: disziplin
        }));
        alleMeldungen.push(...meldungen);
      } catch (e) {
        console.error(`DEBUG: Fehler bei Collection ${disziplin}:`, e.message);
      }
    }
    
    let meldungen = alleMeldungen;
    
    console.log('DEBUG: Alle Meldungen geladen:', meldungen.length);
    
    // Client-seitige Filterung nach clubId wenn angegeben
    if (clubId) {
      console.log('DEBUG: Filtering by clubId:', clubId);
      const shootersSnapshot = await adminDb.collection('shooters').where('clubId', '==', clubId).get();
      const clubShooterIds = shootersSnapshot.docs.map(doc => doc.id);
      console.log('DEBUG: Gefundene Schützen für Verein:', clubShooterIds);
      console.log('DEBUG: Meldungen vor Filter:', meldungen.map(m => ({ schuetzeId: m.schuetzeId })));
      
      meldungen = meldungen.filter(meldung => clubShooterIds.includes(meldung.schuetzeId));
      console.log('DEBUG: Meldungen nach Filter:', meldungen.length);
    } else {
      console.log('DEBUG: Kein clubId-Filter - zeige alle Meldungen');
    }
    
    return NextResponse.json({
      success: true,
      data: meldungen
    });

  } catch (error) {
    console.error('Fehler beim Laden der Meldungen:', error);
    return NextResponse.json({
      success: true,
      data: [],
      message: `Fehler beim Laden: ${error.message}`
    });
  }
}
