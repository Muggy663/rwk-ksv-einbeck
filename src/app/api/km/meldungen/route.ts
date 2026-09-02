// src/app/api/km/meldungen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug, getErrorMessage } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendKMMeldungNotificationEmail } from '@/lib/services/email-notification-service';
import { requireKMAuth } from '@/lib/auth/api-auth';

const getKMMeldungenCollection = (jahr: number, disziplinKuerzel: string) => {
  const kuerzel = disziplinKuerzel.toLowerCase();
  // Mapping für die drei verfügbaren Collections
  if (kuerzel === 'kk' || kuerzel === 'kleinkaliber') return `km_meldungen_${jahr}_kk`;
  if (kuerzel === 'kkp' || kuerzel === 'kleinkaliberpistole') return `km_meldungen_${jahr}_kkp`;
  if (kuerzel === 'ld' || kuerzel === 'luftdruck') return `km_meldungen_${jahr}_ld`;
  return `km_meldungen_${jahr}_${kuerzel}`;
};

export async function POST(request: NextRequest) {
  try {
    // Authentifizierung erforderlich (nur eingeloggte KM-Berechtigte).
    const auth = await requireKMAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const gemeldeteVon = auth.email || 'Vereinsvertreter';

    const body = await request.json();
    const { schuetzeId, disziplinId, saisonId, lmTeilnahme, anmerkung, vmErgebnis } = body;

    if (!schuetzeId || !disziplinId || !saisonId) {
      return NextResponse.json({
        success: false,
        error: 'Schütze, Disziplin und Saison sind erforderlich'
      }, { status: 400 });
    }

    // Hole Saison-Daten
    const saisonDoc = await adminDb.collection('km_saisons').doc(saisonId).get();
    if (!saisonDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Saison nicht gefunden'
      }, { status: 400 });
    }

    const saisonData = saisonDoc.data() as any;
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
      message: getErrorMessage(error),
      code: getErrorMessage(error),
      stack: getErrorMessage(error)
    });
    return NextResponse.json({
      success: false,
      error: `Fehler: ${getErrorMessage(error)}`,
      details: getErrorMessage(error) || 'unknown',
      fullError: getErrorMessage(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
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
      
      const saisonData = saisonDoc.data() as any;
      const disziplinTyp = saisonData.disziplinTyp || 'KK';
      const saisonJahr = saisonData.jahr || 2026;
      
      // Spezielle Collection-Namen für 2026
      let collectionName;
      if (saisonData.name?.includes('Luftdruckgewehr') || saisonData.name?.includes('Luftdruck')) {
        collectionName = `km_meldungen_${saisonJahr}_ld`;
      } else if (saisonData.name?.includes('Kleinkaliber Pistole')) {
        collectionName = `km_meldungen_${saisonJahr}_kkp`;
      } else if (saisonData.name?.includes('Kleinkaliber')) {
        collectionName = `km_meldungen_${saisonJahr}_kk`;
      } else {
        collectionName = getKMMeldungenCollection(saisonJahr, disziplinTyp.toLowerCase());
      }
      
      logDebug('🔍 Saison-Daten:', { saisonId, saisonData: saisonData.name, collectionName });
      
      const snapshot = await adminDb.collection(collectionName).get();
      
      logDebug('🔍 Collection-Ergebnis:', { collectionName, anzahl: snapshot.docs.length });
      
      let meldungen = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _collection: disziplinTyp.toLowerCase()
      })) as Array<{ id: string; [key: string]: any }>;
      
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
    let alleMeldungen: Array<{ id: string; [key: string]: any }> = [];
    
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
        logError(`DEBUG: Fehler bei Collection ${disziplin}:`, getErrorMessage(e));
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
      message: `Fehler beim Laden: ${getErrorMessage(error)}`
    });
  }
}
