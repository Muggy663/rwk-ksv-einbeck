import { NextRequest, NextResponse } from 'next/server';
import { logError, logDebug, getErrorMessage } from '@/lib/utils/secure-logger';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
  logDebug('🔧 Remove duplicate API aufgerufen');
  try {
    const { removeId } = await request.json();
    
    if (!removeId) {
      return NextResponse.json({ error: 'removeId erforderlich' }, { status: 400 });
    }

    // Prüfe ob Dokument existiert
    const docRef = doc(db, 'rwk_scores', removeId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return NextResponse.json({ error: `Dokument ${removeId} nicht gefunden` }, { status: 404 });
    }

    logDebug(`Lösche Duplikat: ${removeId}`, docSnap.data());
    await deleteDoc(docRef);
    
    return NextResponse.json({ success: true, message: 'Duplikat entfernt' });
  } catch (error) {
    logError('Remove duplicate error:', error);
    return NextResponse.json({ 
      error: 'Fehler beim Entfernen des Duplikats', 
      details: getErrorMessage(error) 
    }, { status: 500 });
  }
}
