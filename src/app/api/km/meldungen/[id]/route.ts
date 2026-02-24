import { NextRequest, NextResponse } from 'next/server';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { kmErgebnis, lmTeilnahme, vmErgebnis, anmerkung, disziplinId, saisonId } = body;
    
    const updateData: any = {};
    if (kmErgebnis !== undefined) updateData.kmErgebnis = kmErgebnis;
    if (lmTeilnahme !== undefined) updateData.lmTeilnahme = lmTeilnahme;
    if (vmErgebnis !== undefined) updateData.vmErgebnis = vmErgebnis;
    if (anmerkung !== undefined) updateData.anmerkung = anmerkung;
    if (disziplinId !== undefined) updateData.disziplinId = disziplinId;
    
    const collections = ['km_meldungen_2026_kk', 'km_meldungen_2026_ld', 'km_meldungen_2026_kkp'];
    
    for (const collectionName of collections) {
      try {
        const docRef = adminDb.collection(collectionName).doc(id);
        const doc = await docRef.get();
        
        if (doc.exists) {
          await docRef.update(updateData);
          return NextResponse.json({ success: true });
        }
      } catch (e) {
        continue;
      }
    }
    
    return NextResponse.json({ success: false, error: 'Meldung nicht gefunden' }, { status: 404 });
    
  } catch (error) {
    logError('Fehler beim Update der Meldung:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const collections = ['km_meldungen_2026_kk', 'km_meldungen_2026_ld', 'km_meldungen_2026_kkp'];
    
    for (const collectionName of collections) {
      try {
        const docRef = adminDb.collection(collectionName).doc(id);
        const doc = await docRef.get();
        
        if (doc.exists) {
          await docRef.delete();
          return NextResponse.json({ success: true });
        }
      } catch (e) {
        continue;
      }
    }
    
    return NextResponse.json({ success: false, error: 'Meldung nicht gefunden' }, { status: 404 });
    
  } catch (error) {
    logError('Fehler beim Löschen der Meldung:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}