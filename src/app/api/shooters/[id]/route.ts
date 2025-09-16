import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Authentifizierung und Berechtigung prüfen
async function validateUserPermissions(request: NextRequest, shooterId: string) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Keine gültige Authentifizierung');
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await getAuth().verifyIdToken(token);
  
  // Schütze-Daten laden für Club-Zugehörigkeit
  const shooterDoc = await adminDb.collection('shooters').doc(shooterId).get();
  if (!shooterDoc.exists) {
    throw new Error('Schütze nicht gefunden');
  }

  const shooterData = shooterDoc.data();
  const shooterClubId = shooterData?.clubId || shooterData?.rwkClubId || shooterData?.kmClubId;

  // Benutzer-Berechtigung prüfen
  const userPermissionDoc = await adminDb.collection('user_permissions').doc(decodedToken.uid).get();
  if (!userPermissionDoc.exists) {
    throw new Error('Keine Berechtigung gefunden');
  }

  const userPermission = userPermissionDoc.data();
  
  // Super-Admin oder Vereinsvertreter des gleichen Vereins
  const isSuperAdmin = decodedToken.email === 'admin@rwk-einbeck.de';
  const isAuthorizedForClub = userPermission?.role === 'vereinsvertreter' && 
    (userPermission?.clubId === shooterClubId || userPermission?.assignedClubId === shooterClubId);

  if (!isSuperAdmin && !isAuthorizedForClub) {
    throw new Error('Keine Berechtigung für diesen Schützen');
  }

  return { shooterData, userPermission, decodedToken };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validierung
    if (!params.id || params.id.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Ungültige Schützen-ID'
      }, { status: 400 });
    }

    await validateUserPermissions(request, params.id);

    const body = await request.json();
    const { name, birthYear, gender, mitgliedsnummer } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (birthYear !== undefined) updateData.birthYear = birthYear;
    if (gender !== undefined) updateData.gender = gender;
    if (mitgliedsnummer !== undefined) updateData.mitgliedsnummer = mitgliedsnummer;
    
    updateData.updatedAt = FieldValue.serverTimestamp();

    await adminDb.collection('shooters').doc(params.id).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Schütze aktualisiert'
    });

  } catch (error: any) {
    console.error('Fehler beim Aktualisieren:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Aktualisierung fehlgeschlagen'
    }, { status: error.message?.includes('Berechtigung') ? 403 : 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validierung
    if (!params.id || params.id.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Ungültige Schützen-ID'
      }, { status: 400 });
    }

    const { shooterData } = await validateUserPermissions(request, params.id);
    const shooterId = params.id;
    const shooterName = shooterData.name || `${shooterData.firstName || ''} ${shooterData.lastName || ''}`.trim() || 'Unbekannt';

    // Transaktionale Löschung mit AdminSDK
    const batch = adminDb.batch();

    // 1. Schütze löschen
    const shooterRef = adminDb.collection('shooters').doc(shooterId);
    batch.delete(shooterRef);

    // 2. Aus allen Teams entfernen (rwk_teams)
    const teamsSnapshot = await adminDb.collection('rwk_teams')
      .where('shooterIds', 'array-contains', shooterId)
      .get();
    
    teamsSnapshot.docs.forEach(teamDoc => {
      batch.update(teamDoc.ref, {
        shooterIds: FieldValue.arrayRemove(shooterId),
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    // 3. RWK-Scores als gelöscht markieren (nicht löschen für Statistiken)
    const rwkScoresSnapshot = await adminDb.collection('rwk_scores')
      .where('shooterId', '==', shooterId)
      .get();
    
    rwkScoresSnapshot.docs.forEach(scoreDoc => {
      batch.update(scoreDoc.ref, {
        shooterDeleted: true,
        deletedAt: FieldValue.serverTimestamp(),
        shooterName: shooterName + ' (gelöscht)',
        originalShooterName: scoreDoc.data().shooterName || shooterName
      });
    });

    // 4. KM-Meldungen als gelöscht markieren (vereinfacht)
    let kmMeldungenAffected = 0;
    try {
      const kmMeldungenSnapshot = await adminDb.collection('km_meldungen')
        .where('shooterId', '==', shooterId)
        .limit(50) // Limit für Performance
        .get();
      
      kmMeldungenSnapshot.docs.forEach(meldungDoc => {
        batch.update(meldungDoc.ref, {
          shooterDeleted: true,
          deletedAt: FieldValue.serverTimestamp(),
          shooterName: shooterName + ' (gelöscht)',
          originalShooterName: meldungDoc.data().shooterName || shooterName
        });
      });
      kmMeldungenAffected = kmMeldungenSnapshot.docs.length;
    } catch (kmError) {
      console.warn('KM-Meldungen konnten nicht aktualisiert werden:', kmError);
    }

    // 5. Audit-Log erstellen
    const auditLogRef = adminDb.collection('audit_logs').doc();
    batch.set(auditLogRef, {
      action: 'DELETE_SHOOTER',
      shooterId: shooterId,
      shooterName: shooterName,
      clubId: shooterData.clubId || shooterData.rwkClubId || shooterData.kmClubId,
      timestamp: FieldValue.serverTimestamp(),
      performedBy: request.headers.get('x-user-email') || 'system',
      details: {
        teamsAffected: teamsSnapshot.docs.length,
        scoresAffected: rwkScoresSnapshot.docs.length,
        kmMeldungenAffected: kmMeldungenAffected
      }
    });

    // Batch ausführen
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Schütze "${shooterName}" erfolgreich gelöscht`,
      details: {
        shooterId,
        shooterName,
        teamsAffected: teamsSnapshot.docs.length,
        scoresAffected: rwkScoresSnapshot.docs.length,
        kmMeldungenAffected: kmMeldungenAffected
      }
    });

  } catch (error: any) {
    console.error('Fehler beim Löschen des Schützen:', {
      shooterId: params.id,
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Löschen fehlgeschlagen'
    }, { 
      status: error.message?.includes('Berechtigung') ? 403 : 
              error.message?.includes('nicht gefunden') ? 404 : 500 
    });
  }
}