import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, updateDoc, doc, writeBatch, arrayRemove, arrayUnion } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { action, substitutionId, teamId } = await request.json();

    if (action === 'apply_substitution') {
      const substitutionDoc = await getDocs(
        query(collection(db, 'team_substitutions'), where('__name__', '==', substitutionId))
      );
      
      if (substitutionDoc.empty) {
        return NextResponse.json({ error: 'Substitution nicht gefunden' }, { status: 404 });
      }

      const substitution = { id: substitutionDoc.docs[0].id, ...substitutionDoc.docs[0].data() };

      const teamDoc = await getDocs(
        query(collection(db, 'rwk_teams'), where('__name__', '==', teamId))
      );
      
      if (teamDoc.empty) {
        return NextResponse.json({ error: 'Team nicht gefunden' }, { status: 404 });
      }

      const team = { id: teamDoc.docs[0].id, ...teamDoc.docs[0].data() };

      const updatedShooterIds = team.shooterIds.map((id: string) => 
        id === substitution.originalShooterId ? substitution.replacementShooterId : id
      );

      await updateDoc(doc(db, 'rwk_teams', teamId), {
        shooterIds: updatedShooterIds
      });

      const batch = writeBatch(db);
      
      const originalShooterRef = doc(db, 'shooters', substitution.originalShooterId);
      batch.update(originalShooterRef, {
        teamIds: arrayRemove(teamId)
      });
      
      const replacementShooterRef = doc(db, 'shooters', substitution.replacementShooterId);
      batch.update(replacementShooterRef, {
        teamIds: arrayUnion(teamId)
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