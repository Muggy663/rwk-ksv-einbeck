// src/app/api/clubs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await getDocs(collection(db, 'clubs'));
    const clubs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: clubs
    });

  } catch (error) {
    console.error('Fehler beim Laden der Vereine:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Vereine'
    }, { status: 500 });
  }
}