import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { lmTeilnahme, anmerkung, vmErgebnis, disziplinId } = body;
    
    // Finde die Meldung in allen möglichen Collections
    const saisons = await adminDb.collection('km_saisons').get();
    const collections = [];
    
    saisons.docs.forEach(doc => {
      const saison = doc.data();
      collections.push(`km_meldungen_${saison.jahr}_${saison.disziplinTyp.toLowerCase()}`);
    });
    
    let updated = false;
    
    for (const collectionName of collections) {
      try {
        const docRef = adminDb.collection(collectionName).doc(id);
        const doc = await docRef.get();
        
        if (doc.exists) {
          await docRef.update({
            lmTeilnahme: !!lmTeilnahme,
            anmerkung: anmerkung || '',
            vmErgebnis: vmErgebnis || null,
            ...(disziplinId && { disziplinId }),
            updatedAt: new Date()
          });
          updated = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!updated) {
      return NextResponse.json({
        success: false,
        error: 'Meldung nicht gefunden'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Meldung erfolgreich aktualisiert'
    });
    
  } catch (error) {
    logError('Fehler beim Aktualisieren der Meldung:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { lmTeilnahme, anmerkung, vmErgebnis } = body;
    
    // Finde die Meldung in allen möglichen Collections
    const saisons = await adminDb.collection('km_saisons').get();
    const collections = [];
    
    saisons.docs.forEach(doc => {
      const saison = doc.data();
      collections.push(`km_meldungen_${saison.jahr}_${saison.disziplinTyp.toLowerCase()}`);
    });
    
    let updated = false;
    
    for (const collectionName of collections) {
      try {
        const docRef = adminDb.collection(collectionName).doc(id);
        const doc = await docRef.get();
        
        if (doc.exists) {
          await docRef.update({
            lmTeilnahme: !!lmTeilnahme,
            anmerkung: anmerkung || '',
            vmErgebnis: vmErgebnis || null,
            updatedAt: new Date()
          });
          updated = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!updated) {
      return NextResponse.json({
        success: false,
        error: 'Meldung nicht gefunden'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Meldung erfolgreich aktualisiert'
    });
    
  } catch (error) {
    logError('Fehler beim Aktualisieren der Meldung:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Finde die Meldung in allen möglichen Collections
    const saisons = await adminDb.collection('km_saisons').get();
    const collections = [];
    
    saisons.docs.forEach(doc => {
      const saison = doc.data();
      collections.push(`km_meldungen_${saison.jahr}_${saison.disziplinTyp.toLowerCase()}`);
    });
    
    let deleted = false;
    
    for (const collectionName of collections) {
      try {
        const docRef = adminDb.collection(collectionName).doc(id);
        const doc = await docRef.get();
        
        if (doc.exists) {
          await docRef.delete();
          deleted = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Meldung nicht gefunden'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Meldung erfolgreich gelöscht'
    });
    
  } catch (error) {
    logError('Fehler beim Löschen der Meldung:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}