// src/app/api/km/meldungen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { KMMeldung } from '@/types/km';

const KM_MELDUNGEN_COLLECTION = 'km_meldungen';

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

    // Echte Firestore-Speicherung
    const meldung = {
      schuetzeId,
      disziplinId,
      lmTeilnahme: !!lmTeilnahme,
      anmerkung: anmerkung || '',
      saison: '2026',
      jahr: 2026, // Jahres-Filter für Archivierung
      meldedatum: new Date(),
      status: 'gemeldet',
      gemeldeteVon,
      vmErgebnis: vmErgebnis || null
    };

    const docRef = await addDoc(collection(db, KM_MELDUNGEN_COLLECTION), meldung);

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
    
    // Filtere nach Jahr (für 2027+ wichtig)
    const q = query(
      collection(db, KM_MELDUNGEN_COLLECTION),
      where('jahr', '==', jahr)
    );
    
    const snapshot = await getDocs(q);
    let meldungen = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('DEBUG: Alle Meldungen geladen:', meldungen.length);
    
    // Client-seitige Filterung nach clubId wenn angegeben
    if (clubId) {
      console.log('DEBUG: Filtering by clubId:', clubId);
      const shootersQuery = query(collection(db, 'shooters'), where('clubId', '==', clubId));
      const shootersSnapshot = await getDocs(shootersQuery);
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
