import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn, logDebug } from '@/lib/utils/secure-logger';
import { verifyApiAuth } from '@/lib/auth/api-auth';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  // Nur SuperAdmin darf Rollen zuweisen
  const user = await verifyApiAuth(request);
  if (!user) {
    logWarn('Unauthorized access attempt to assign-roles', 'assign-roles-api');
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  if (user.email !== 'admin@rwk-einbeck.de') {
    logWarn(`Forbidden access attempt to assign-roles by ${user.email}`, 'assign-roles-api');
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { action } = await request.json();
    
    if (action === 'assign_sample_roles') {
      logDebug('🎯 Weise Beispiel-Rollen zu...');
      
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
          
          if ((userDoc.exists as any)()) {
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
              logDebug(`✅ ${assignment.email}: ${assignment.clubRole} für Club ${clubId}`);
            }
          }
        } catch (error) {
          logError(`❌ Fehler bei ${assignment.email}:`, error);
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
    logError('❌ Rollen-Zuweisung Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Rollen-Zuweisung fehlgeschlagen'
    }, { status: 500 });
  }
}
