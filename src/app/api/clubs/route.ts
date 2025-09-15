// src/app/api/clubs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection('clubs').get();
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