import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'assign_sample_roles') {
      console.log('🎯 Weise Beispiel-Rollen zu...');
      
      const batch = adminDb.batch();
      let count = 0;
      
      // Beispiel-Zuweisungen für bestehende Benutzer
      const sampleAssignments = [
        {
          email: 'marcel.buenger@gmx.de',
          clubRole: 'KASSENWART', // Zusätzlich zu SPORTLEITER
          description: 'Kassenwart-Rolle hinzufügen'
        }
        // Weitere Beispiele können hier hinzugefügt werden
      ];
      
      for (const assignment of sampleAssignments) {
        try {
          const userDoc = await adminDb.collection('user_permissions').doc(assignment.email).get();
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            const existingClubRoles = data?.clubRoles || {};
            
            // Finde den ersten Club (oder verwende bestehenden)
            const clubId = data?.clubId || data?.assignedClubId || Object.keys(existingClubRoles)[0];
            
            if (clubId) {
              // Füge neue Rolle hinzu (behält bestehende)
              const updatedClubRoles = {
                ...existingClubRoles,
                [clubId]: assignment.clubRole
              };
              
              batch.update(userDoc.ref, {
                clubRoles: updatedClubRoles,
                updatedAt: FieldValue.serverTimestamp()
              });
              
              count++;
              console.log(`✅ ${assignment.email}: ${assignment.clubRole} für Club ${clubId}`);
            }
          }
        } catch (error) {
          console.error(`❌ Fehler bei ${assignment.email}:`, error);
        }
      }
      
      if (count > 0) {
        await batch.commit();
        return NextResponse.json({
          success: true,
          message: `${count} Rollen-Zuweisungen erfolgreich`
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'Keine Zuweisungen erforderlich'
        });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unbekannte Aktion'
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('❌ Rollen-Zuweisung Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Rollen-Zuweisung fehlgeschlagen'
    }, { status: 500 });
  }
}
