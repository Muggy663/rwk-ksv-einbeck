import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

const KM_JAHRE_COLLECTION = 'km_jahre';

export async function GET(request: NextRequest) {
  try {
    // Hole das aktive Jahr
    const snapshot = await adminDb.collection(KM_JAHRE_COLLECTION)
      .where('status', '==', 'aktiv')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      // Fallback: aktuelles Jahr
      return NextResponse.json({
        success: true,
        data: {
          jahr: new Date().getFullYear(),
          meldeschluss: '15.12.' + (new Date().getFullYear() - 1),
          status: 'aktiv'
        }
      });
    }

    const aktivesJahr = snapshot.docs[0];
    return NextResponse.json({
      success: true,
      data: {
        id: aktivesJahr.id,
        ...aktivesJahr.data()
      }
    });

  } catch (error) {
    console.error('Fehler beim Laden des aktuellen Jahres:', error);
    return NextResponse.json({
      success: true,
      data: {
        jahr: new Date().getFullYear(),
        meldeschluss: '15.12.' + (new Date().getFullYear() - 1),
        status: 'aktiv'
      }
    });
  }
}