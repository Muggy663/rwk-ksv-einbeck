import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { logError } from '@/lib/utils/secure-logger';

const defaultData = [
  { klassenId: 10, name: 'Herren I', minAlter: 21, maxAlter: 40, geschlecht: 1 },
  { klassenId: 11, name: 'Damen I', minAlter: 21, maxAlter: 40, geschlecht: 0 },
  { klassenId: 12, name: 'Herren II', minAlter: 41, maxAlter: 50, geschlecht: 1 },
  { klassenId: 13, name: 'Damen II', minAlter: 41, maxAlter: 50, geschlecht: 0 },
  { klassenId: 14, name: 'Herren III', minAlter: 51, maxAlter: 60, geschlecht: 1 },
  { klassenId: 15, name: 'Damen III', minAlter: 51, maxAlter: 60, geschlecht: 0 },
  { klassenId: 16, name: 'Herren IV', minAlter: 61, maxAlter: 255, geschlecht: 1 },
  { klassenId: 17, name: 'Damen IV', minAlter: 61, maxAlter: 255, geschlecht: 0 },
  { klassenId: 20, name: 'Schüler männl.', minAlter: 0, maxAlter: 14, geschlecht: 1 },
  { klassenId: 21, name: 'Schüler weibl.', minAlter: 0, maxAlter: 14, geschlecht: 0 },
  { klassenId: 30, name: 'Jugend männl.', minAlter: 15, maxAlter: 16, geschlecht: 1 },
  { klassenId: 31, name: 'Jugend weibl.', minAlter: 15, maxAlter: 16, geschlecht: 0 },
  { klassenId: 40, name: 'Junioren I männl.', minAlter: 19, maxAlter: 20, geschlecht: 1 },
  { klassenId: 41, name: 'Junioren I weibl.', minAlter: 19, maxAlter: 20, geschlecht: 0 },
  { klassenId: 42, name: 'Junioren II männl.', minAlter: 17, maxAlter: 18, geschlecht: 1 },
  { klassenId: 43, name: 'Junioren II weibl.', minAlter: 17, maxAlter: 18, geschlecht: 0 },
  { klassenId: 70, name: 'Senioren I männl.', minAlter: 51, maxAlter: 60, geschlecht: 1 },
  { klassenId: 71, name: 'Senioren I weibl.', minAlter: 51, maxAlter: 60, geschlecht: 0 },
  { klassenId: 72, name: 'Senioren II männl.', minAlter: 61, maxAlter: 65, geschlecht: 1 },
  { klassenId: 73, name: 'Senioren II weibl.', minAlter: 61, maxAlter: 65, geschlecht: 0 },
  { klassenId: 74, name: 'Senioren III männl.', minAlter: 66, maxAlter: 70, geschlecht: 1 },
  { klassenId: 75, name: 'Senioren III weibl.', minAlter: 66, maxAlter: 70, geschlecht: 0 },
  { klassenId: 76, name: 'Senioren IV männl.', minAlter: 71, maxAlter: 75, geschlecht: 1 },
  { klassenId: 77, name: 'Senioren IV weibl.', minAlter: 71, maxAlter: 75, geschlecht: 0 },
  { klassenId: 78, name: 'Senioren V männl.', minAlter: 76, maxAlter: 255, geschlecht: 1 },
  { klassenId: 79, name: 'Senioren V weibl.', minAlter: 76, maxAlter: 255, geschlecht: 0 },
  { klassenId: 80, name: 'Senioren 0', minAlter: 41, maxAlter: 50, geschlecht: 1 },
  { klassenId: 81, name: 'Seniorinnen 0', minAlter: 41, maxAlter: 50, geschlecht: 0 },
  { klassenId: 99, name: 'offene Klasse', minAlter: 0, maxAlter: 255, geschlecht: 2 }
];

export async function GET() {
  try {
    const snapshot = await adminDb.collection('km_altersklassen').get();
    let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Falls leer, initialisiere mit Standard-Daten
    if (data.length === 0) {
      for (const item of defaultData) {
        await adminDb.collection('km_altersklassen').add(item);
      }
      const newSnapshot = await adminDb.collection('km_altersklassen').get();
      data = newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logError('GET error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Fehler' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...dataToSave } = body;
    const docRef = await adminDb.collection('km_altersklassen').add(dataToSave);
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    logError('POST error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Fehler' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) throw new Error('ID fehlt');
    await adminDb.collection('km_altersklassen').doc(id).update(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    logError('PUT error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Fehler' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error('ID fehlt');
    await adminDb.collection('km_altersklassen').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    logError('DELETE error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Fehler' }, { status: 500 });
  }
}