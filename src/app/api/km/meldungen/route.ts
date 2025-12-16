// src/app/api/km/meldungen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { KMMeldung } from '@/types/km';
import { sendKMMeldungNotificationEmail } from '@/lib/services/email-notification-service';

const getKMMeldungenCollection = (jahr: number, disziplinKuerzel: string) => {
  const kuerzel = disziplinKuerzel.toLowerCase();
  // Mapping für die drei verfügbaren Collections
  if (kuerzel === 'kk' || kuerzel === 'kleinkaliber') return `km_meldungen_${jahr}_kk`;
  if (kuerzel === 'kkp' || kuerzel === 'kleinkaliberpistole') return `km_meldungen_${jahr}_kkp`;
  if (kuerzel === 'ld' || kuerzel === 'luftdruck') return `km_meldungen_${jahr}_ld`;
  return `km_meldungen_${jahr}_${kuerzel}`;
};

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
    logWarn('Fallback Disziplin-Kürzel:', e);
  }
  return 'ld'; // Fallback
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schuetzeId, disziplinId, saisonId, lmTeilnahme, anmerkung, vmErgebnis } = body;

    if (!schuetzeId || !disziplinId || !saisonId) {
      return NextResponse.json({
        success: false,
        error: 'Schütze, Disziplin und Saison sind erforderlich'
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

    // Hole Saison-Daten
    const saisonDoc = await adminDb.collection('km_saisons').doc(saisonId).get();
    if (!saisonDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Saison nicht gefunden'
      }, { status: 400 });
    }

    const saisonData = saisonDoc.data();
    const aktivesJahr = saisonData.jahr;
    const disziplinTyp = saisonData.disziplinTyp; // 'KK' oder 'LD'

    // Verwende Disziplin-Typ aus Saison
    const disziplinKuerzel = disziplinTyp.toLowerCase();

    // DUPLIKATSPRÜFUNG: Prüfe ob Schütze bereits für diese Disziplin gemeldet ist
    const collectionName = getKMMeldungenCollection(aktivesJahr, disziplinKuerzel);
    const existingMeldungen = await adminDb.collection(collectionName)
      .where('schuetzeId', '==', schuetzeId)
      .where('disziplinId', '==', disziplinId)
      .get();
    
    if (!existingMeldungen.empty) {
      logWarn(`DUPLIKAT ERKANNT: Schütze ${schuetzeId} bereits für Disziplin ${disziplinId} in ${collectionName} gemeldet`);
      return NextResponse.json({
        success: false,
        error: 'Schütze ist bereits für diese Disziplin gemeldet',
        duplicate: true
      }, { status: 409 });
    }

    // Echte Firestore-Speicherung
    const meldung = {
      schuetzeId,
      disziplinId,
      saisonId,
      lmTeilnahme: !!lmTeilnahme,
      anmerkung: anmerkung || '',
      saison: aktivesJahr.toString(),
      jahr: aktivesJahr,
      meldedatum: new Date(),
      status: 'gemeldet',
      gemeldeteVon,
      vmErgebnis: vmErgebnis || null
    };

    const docRef = await adminDb.collection(getKMMeldungenCollection(aktivesJahr, disziplinKuerzel)).add({
      ...meldung,
      meldedatum: FieldValue.serverTimestamp()
    });

    // E-Mail-Benachrichtigung senden
    try {
      // Hole Schützen-Daten für die E-Mail
      const schuetzeDoc = await adminDb.collection('shooters').doc(schuetzeId).get();
      const schuetzeName = schuetzeDoc.exists ? schuetzeDoc.data()?.name || 'Unbekannt' : 'Unbekannt';
      
      // Hole Disziplin-Daten
      const disziplinDoc = await adminDb.collection('km_disziplinen').doc(disziplinId).get();
      const disziplinName = disziplinDoc.exists ? disziplinDoc.data()?.name || 'Unbekannt' : 'Unbekannt';
      
      await sendKMMeldungNotificationEmail({
        schuetzeName,
        disziplinName,
        lmTeilnahme: !!lmTeilnahme,
        anmerkung: anmerkung || '',
        vmErgebnis: vmErgebnis || null,
        gemeldeteVon,
        jahr: aktivesJahr,
        timestamp: new Date()
      });
      
      logInfo(`KM-Meldung E-Mail gesendet: ${schuetzeName} - ${disziplinName}`);
    } catch (emailError) {
      logError('Fehler beim Senden der KM-Meldung E-Mail:', emailError);
      // E-Mail-Fehler nicht an Client weiterleiten - Meldung ist trotzdem gespeichert
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...meldung },
      message: 'Meldung erfolgreich erstellt'
    });

  } catch (error) {
    logError('Fehler beim Erstellen der Meldung:', error);
    logError('Error details:', {
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
    const saisonId = searchParams.get('saison');
    const clubId = searchParams.get('clubId');
    
    // Wenn saisonId angegeben, filtere nach Saison
    if (saisonId) {
      const saisonDoc = await adminDb.collection('km_saisons').doc(saisonId).get();
      if (!saisonDoc.exists) {
        return NextResponse.json({ success: true, data: [] });
      }
      
      const saisonData = saisonDoc.data();
      const disziplinTyp = saisonData.disziplinTyp; // 'KK' oder 'LD'
      const saisonJahr = saisonData.jahr;
      
      const collectionName = getKMMeldungenCollection(saisonJahr, disziplinTyp.toLowerCase());
      const snapshot = await adminDb.collection(collectionName).get();
      
      let meldungen = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _collection: disziplinTyp.toLowerCase()
      }));
      
      if (clubId) {
        const shootersSnapshot = await adminDb.collection('shooters').where('clubId', '==', clubId).get();
        const clubShooterIds = shootersSnapshot.docs.map(doc => doc.id);
        meldungen = meldungen.filter(meldung => clubShooterIds.includes(meldung.schuetzeId));
      }
      
      return NextResponse.json({
        success: true,
        data: meldungen
      });
    }
    
    // Fallback: Alle Disziplinen für ein Jahr laden
    const collections = ['kk', 'kkp', 'ld'];
    let alleMeldungen = [];
    
    logDebug('DEBUG: Suche in Jahr:', jahr);
    
    for (const disziplin of collections) {
      try {
        const collectionName = getKMMeldungenCollection(jahr, disziplin);
        logDebug('DEBUG: Lade Collection:', collectionName);
        
        const snapshot = await adminDb.collection(collectionName).get();
        
        logDebug(`DEBUG: Collection ${collectionName} hat ${snapshot.docs.length} Dokumente`);
        
        const meldungen = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          _collection: disziplin
        }));
        alleMeldungen.push(...meldungen);
      } catch (e) {
        logError(`DEBUG: Fehler bei Collection ${disziplin}:`, e.message);
      }
    }
    
    let meldungen = alleMeldungen;
    
    logDebug('DEBUG: Alle Meldungen geladen:', meldungen.length);
    
    // Client-seitige Filterung nach clubId wenn angegeben
    if (clubId) {
      logDebug('DEBUG: Filtering by clubId:', clubId);
      const shootersSnapshot = await adminDb.collection('shooters').where('clubId', '==', clubId).get();
      const clubShooterIds = shootersSnapshot.docs.map(doc => doc.id);
      logDebug('DEBUG: Gefundene Schützen für Verein:', clubShooterIds);
      logDebug('DEBUG: Meldungen vor Filter:', meldungen.map(m => ({ schuetzeId: m.schuetzeId })));
      
      meldungen = meldungen.filter(meldung => clubShooterIds.includes(meldung.schuetzeId));
      logDebug('DEBUG: Meldungen nach Filter:', meldungen.length);
    } else {
      logDebug('DEBUG: Kein clubId-Filter - zeige alle Meldungen');
    }
    
    return NextResponse.json({
      success: true,
      data: meldungen
    });

  } catch (error) {
    logError('Fehler beim Laden der Meldungen:', error);
    return NextResponse.json({
      success: true,
      data: [],
      message: `Fehler beim Laden: ${error.message}`
    });
  }
}
