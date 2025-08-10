import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, birthYear, gender, mitgliedsnummer } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (birthYear !== undefined) updateData.birthYear = birthYear;
    if (gender !== undefined) updateData.gender = gender;
    if (mitgliedsnummer !== undefined) updateData.mitgliedsnummer = mitgliedsnummer;
    
    updateData.updatedAt = new Date();

    await updateDoc(doc(db, 'shooters', params.id), updateData);

    return NextResponse.json({
      success: true,
      message: 'Schütze aktualisiert'
    });

  } catch (error) {
    console.error('Fehler beim Aktualisieren:', error);
    return NextResponse.json({
      success: false,
      error: 'Aktualisierung fehlgeschlagen'
    }, { status: 500 });
  }
}