import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const q = query(collection(db, 'vereinsrecht_satzung'), orderBy('datum', 'desc'));
    const snapshot = await getDocs(q);
    
    const dokumente = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ dokumente });
  } catch (error) {
    console.error('Fehler beim Laden der Satzungsdokumente:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const docRef = await addDoc(collection(db, 'vereinsrecht_satzung'), {
      ...data,
      erstelltAm: new Date().toISOString(),
      erstelltVon: data.erstelltVon || 'System'
    });

    return NextResponse.json({ id: docRef.id, message: 'Dokument erstellt' });
  } catch (error) {
    console.error('Fehler beim Erstellen des Dokuments:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }
}