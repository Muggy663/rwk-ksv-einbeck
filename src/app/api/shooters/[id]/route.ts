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
  
  // Debug-Logging
  console.log('DELETE Shooter Debug:', {
    shooterId: params.id,
    userEmail: decodedToken.email,
    userPermission: userPermission,
    shooterClubId: shooterClubId
  });
  
  // Vereinfachte Berechtigung - erstmal alle Vereinsvertreter und Sportleiter erlauben
  const isSuperAdmin = decodedToken.email === 'admin@rwk-einbeck.de';
  const hasClubAccess = userPermission?.role === 'vereinsvertreter' || 
    (userPermission?.clubRoles && Object.values(userPermission.clubRoles).includes('SPORTLEITER'));

  if (!isSuperAdmin && !hasClubAccess) {
    console.error('Permission denied:', { isSuperAdmin, hasClubAccess, userPermission });
    throw new Error('Keine Berechtigung für diesen Schützen');
  }
  
  console.log('Permission granted:', { isSuperAdmin, hasClubAccess });

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
    if (!params.id) {
      return NextResponse.json({ success: false, error: 'Keine ID' }, { status: 400 });
    }

    // Einfache Auth-Prüfung
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Keine Auth' }, { status: 401 });
    }

    // Schütze einfach löschen
    await adminDb.collection('shooters').doc(params.id).delete();

    return NextResponse.json({
      success: true,
      message: 'Schütze gelöscht'
    });

  } catch (error: any) {
    console.error('DELETE Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Fehler'
    }, { status: 500 });
  }
}