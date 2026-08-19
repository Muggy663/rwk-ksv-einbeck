import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn, logInfo, logDebug, getErrorMessage } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const KM_SAISONS_COLLECTION = 'km_saisons';

type DisziplinTyp = 'KK' | 'LD' | 'KKP';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jahr, disziplinTyp, meldeschluss, status, beschreibung } = body;

    if (!jahr || !disziplinTyp || !meldeschluss) {
      return NextResponse.json({
        success: false,
        error: 'Jahr, Disziplin-Typ und Meldeschluss sind erforderlich'
      }, { status: 400 });
    }

    if (!['KK', 'LD', 'KKP'].includes(disziplinTyp)) {
      return NextResponse.json({
        success: false,
        error: 'Disziplin-Typ muss KK, LD oder KKP sein'
      }, { status: 400 });
    }

    // Prüfe ob Saison bereits existiert
    const existingQuery = await adminDb.collection(KM_SAISONS_COLLECTION)
      .where('jahr', '==', parseInt(jahr))
      .where('disziplinTyp', '==', disziplinTyp)
      .get();
    
    if (!existingQuery.empty) {
      return NextResponse.json({
        success: false,
        error: `KM ${jahr} ${disziplinTyp === 'KK' ? 'Kleinkaliber' : disziplinTyp === 'LD' ? 'Luftdruck' : 'Kleinkaliber Pistole'} existiert bereits`
      }, { status: 400 });
    }

    const disziplinName = disziplinTyp === 'KK' ? 'Kleinkaliber' : disziplinTyp === 'LD' ? 'Luftdruck' : 'Kleinkaliber Pistole';
    const collectionKuerzel = disziplinTyp.toLowerCase(); // kk, ld, kkp
    const meldungenCollectionName = `km_meldungen_${jahr}_${collectionKuerzel}`;
    
    const kmSaison = {
      jahr: parseInt(jahr),
      disziplinTyp,
      name: `KM ${jahr} ${disziplinName}`,
      collectionName: meldungenCollectionName,
      meldeschluss,
      status: status || 'vorbereitung',
      beschreibung: beschreibung || '',
      erstelltAm: FieldValue.serverTimestamp(),
      aktualisiertAm: FieldValue.serverTimestamp()
    };

    const docRef = await adminDb.collection(KM_SAISONS_COLLECTION).add(kmSaison);

    logInfo(`Saison ${kmSaison.name} erstellt, Collection: ${meldungenCollectionName}`);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...kmSaison },
      message: `KM-Saison ${kmSaison.name} erfolgreich erstellt`
    });

  } catch (error) {
    logError('Fehler beim Erstellen der KM-Saison:', error);
    return NextResponse.json({
      success: false,
      error: `Fehler: ${getErrorMessage(error)}`
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection(KM_SAISONS_COLLECTION)
      .orderBy('jahr', 'desc')
      .orderBy('disziplinTyp', 'asc')
      .get();
    
    const saisons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      data: saisons
    });

  } catch (error) {
    logError('Fehler beim Laden der KM-Saisons:', error);
    return NextResponse.json({
      success: true,
      data: [],
      message: `Fehler beim Laden: ${getErrorMessage(error)}`
    });
  }
}
