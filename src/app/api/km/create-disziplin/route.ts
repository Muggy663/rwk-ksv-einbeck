import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { id, data } = await request.json();
    
    console.log(`📝 Erstelle Disziplin: ${id} - ${data.spoNummer} ${data.name}`);
    
    // Erstelle Disziplin mit exakter ID
    await adminDb.collection('km_disziplinen').doc(id).set(data);
    
    return NextResponse.json({
      success: true,
      message: `Disziplin ${data.spoNummer} - ${data.name} erstellt`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}