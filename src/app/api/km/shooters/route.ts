import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET() {
  try {
    const shootersSnap = await getDocs(collection(db, 'km_shooters'));
    const shooters = shootersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ 
      success: true, 
      data: shooters,
      count: shooters.length 
    });
  } catch (error) {
    console.error('KM Shooters API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch KM shooters' 
    }, { status: 500 });
  }
}