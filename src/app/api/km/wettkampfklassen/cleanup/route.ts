// src/app/api/km/wettkampfklassen/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { requireKMAuth } from '@/lib/auth/api-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const snapshot = await getDocs(collection(db, 'km_wettkampfklassen'));
    const klassen = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; [key: string]: any }>;

    // Gruppiere nach Name
    const grouped = new Map();
    klassen.forEach(k => {
      if (!grouped.has(k.name)) {
        grouped.set(k.name, []);
      }
      grouped.get(k.name).push(k);
    });

    let deletedCount = 0;
    
    // Lösche Duplikate (behalte jeweils das erste)
    for (const [, docs] of grouped) {
      if (docs.length > 1) {
        // Lösche alle außer dem ersten
        for (let i = 1; i < docs.length; i++) {
          await deleteDoc(doc(db, 'km_wettkampfklassen', docs[i].id));
          deletedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${deletedCount} doppelte Wettkampfklassen gelöscht`
    });

  } catch (error) {
    logError('Fehler beim Bereinigen der Wettkampfklassen:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Bereinigen der Wettkampfklassen'
    }, { status: 500 });
  }
}
