import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    const teamsSnapshot = await getDocs(collection(db, 'teams'));
    const shootersSnapshot = await getDocs(collection(db, 'shooters'));
    
    const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const shooters = shootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return NextResponse.json({
      success: true,
      data: { teams, shooters }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}