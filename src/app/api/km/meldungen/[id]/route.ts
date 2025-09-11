import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, deleteDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { lmTeilnahme, vmErgebnis, anmerkung } = body;

    // Hole aktuelles Jahr
    let aktivesJahr = 2026;
    try {
      const jahreQuery = query(collection(db, 'km_jahre'), where('status', '==', 'aktiv'));
      const jahreSnapshot = await getDocs(jahreQuery);
      if (!jahreSnapshot.empty) {
        aktivesJahr = jahreSnapshot.docs[0].data().jahr;
      }
    } catch (e) {
      console.warn('Fallback auf Jahr 2026');
    }

    // Finde das Dokument in den Collections
    const collections = [`km_meldungen_${aktivesJahr}_kk`, `km_meldungen_${aktivesJahr}_ld`];
    let docFound = false;
    
    for (const collectionName of collections) {
      try {
        const docRef = doc(db, collectionName, params.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const updateData: any = {};
          
          if (lmTeilnahme !== undefined) updateData.lmTeilnahme = lmTeilnahme;
          if (vmErgebnis !== undefined) updateData.vmErgebnis = vmErgebnis;
          if (anmerkung !== undefined) updateData.anmerkung = anmerkung;
          
          await updateDoc(docRef, updateData);
          docFound = true;
          break;
        }
      } catch (e) {
        // Collection existiert nicht oder anderer Fehler
        continue;
      }
    }

    if (!docFound) {
      return NextResponse.json({
        success: false,
        error: 'Meldung nicht gefunden'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Meldung aktualisiert'
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren:', error);
    return NextResponse.json({
      success: false,
      error: 'Update fehlgeschlagen'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Hole aktuelles Jahr
    let aktivesJahr = 2026;
    try {
      const jahreQuery = query(collection(db, 'km_jahre'), where('status', '==', 'aktiv'));
      const jahreSnapshot = await getDocs(jahreQuery);
      if (!jahreSnapshot.empty) {
        aktivesJahr = jahreSnapshot.docs[0].data().jahr;
      }
    } catch (e) {
      console.warn('Fallback auf Jahr 2026');
    }

    // Finde und lösche das Dokument
    const collections = [`km_meldungen_${aktivesJahr}_kk`, `km_meldungen_${aktivesJahr}_ld`];
    let docFound = false;
    
    for (const collectionName of collections) {
      try {
        const docRef = doc(db, collectionName, params.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          await deleteDoc(docRef);
          docFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!docFound) {
      return NextResponse.json({
        success: false,
        error: 'Meldung nicht gefunden'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Meldung gelöscht'
    });

  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    return NextResponse.json({
      success: false,
      error: 'Löschen fehlgeschlagen'
    }, { status: 500 });
  }
}