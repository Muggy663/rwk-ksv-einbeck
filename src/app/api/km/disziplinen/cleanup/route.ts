// src/app/api/km/disziplinen/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const snapshot = await getDocs(collection(db, 'km_disziplinen'));
    const disziplinen = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Gruppiere nach SpO-Nummer
    const grouped = new Map();
    disziplinen.forEach(d => {
      if (!grouped.has(d.spoNummer)) {
        grouped.set(d.spoNummer, []);
      }
      grouped.get(d.spoNummer).push(d);
    });

    let deletedCount = 0;
    
    // Lösche Duplikate (behalte jeweils das erste)
    for (const [spoNummer, docs] of grouped) {
      if (docs.length > 1) {
        // Lösche alle außer dem ersten
        for (let i = 1; i < docs.length; i++) {
          await deleteDoc(doc(db, 'km_disziplinen', docs[i].id));
          deletedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${deletedCount} doppelte Disziplinen gelöscht`
    });

  } catch (error) {
    console.error('Fehler beim Bereinigen der Disziplinen:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Bereinigen der Disziplinen'
    }, { status: 500 });
  }
}