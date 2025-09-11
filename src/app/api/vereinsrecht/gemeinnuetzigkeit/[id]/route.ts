import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { type, ...data } = await request.json();
    const collection_name = type === 'spende' ? 'vereinsrecht_spenden' : 'vereinsrecht_compliance';
    const docRef = doc(db, collection_name, params.id);
    
    await updateDoc(docRef, {
      ...data,
      aktualisiertAm: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Eintrag aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { type } = await request.json();
    const collection_name = type === 'spende' ? 'vereinsrecht_spenden' : 'vereinsrecht_compliance';
    const docRef = doc(db, collection_name, params.id);
    await deleteDoc(docRef);

    return NextResponse.json({ message: 'Eintrag gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }
}