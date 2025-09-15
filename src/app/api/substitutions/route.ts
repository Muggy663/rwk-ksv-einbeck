import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { action, substitutionId, teamId } = await request.json();

    if (action === 'apply_substitution') {
      const substitutionDoc = await adminDb.collection('team_substitutions').doc(substitutionId).get();
      
      if (!substitutionDoc.exists) {
        return NextResponse.json({ error: 'Substitution nicht gefunden' }, { status: 404 });
      }

      const substitution = { id: substitutionDoc.id, ...substitutionDoc.data() };

      const teamDoc = await adminDb.collection('rwk_teams').doc(teamId).get();
      
      if (!teamDoc.exists) {
        return NextResponse.json({ error: 'Team nicht gefunden' }, { status: 404 });
      }

      const team = { id: teamDoc.id, ...teamDoc.data() };

      const updatedShooterIds = team.shooterIds.map((id: string) => 
        id === substitution.originalShooterId ? substitution.replacementShooterId : id
      );

      await adminDb.collection('rwk_teams').doc(teamId).update({
        shooterIds: updatedShooterIds
      });

      const batch = adminDb.batch();
      
      const originalShooterRef = adminDb.collection('shooters').doc(substitution.originalShooterId);
      batch.update(originalShooterRef, {
        teamIds: FieldValue.arrayRemove(teamId)
      });
      
      const replacementShooterRef = adminDb.collection('shooters').doc(substitution.replacementShooterId);
      batch.update(replacementShooterRef, {
        teamIds: FieldValue.arrayUnion(teamId)
      });

      await batch.commit();

      return NextResponse.json({ 
        success: true, 
        message: 'Ersatzschütze erfolgreich angewendet' 
      });
    }

    return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 });

  } catch (error) {
    console.error('Fehler bei Substitution API:', error);
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
}