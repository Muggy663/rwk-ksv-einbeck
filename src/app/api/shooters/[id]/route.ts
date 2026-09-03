import { NextRequest, NextResponse } from 'next/server';
import { logError, logDebug } from '@/lib/utils/secure-logger';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Authentifizierung und Berechtigung prüfen
async function validateUserPermissions(request: NextRequest, _shooterId: string) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Keine gültige Authentifizierung');
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await getAuth().verifyIdToken(token);
  
  // Vereinfachte Berechtigung - alle eingeloggten Benutzer dürfen bearbeiten
  const isSuperAdmin = decodedToken.email === 'admin@rwk-einbeck.de';
  const isKMOrga = decodedToken.email === 'stephanie.buenger@gmx.de';
  
  if (!isSuperAdmin && !isKMOrga) {
    // Prüfe ob Benutzer KM-Berechtigung hat
    const userPermissionDoc = await adminDb.collection('user_permissions').doc(decodedToken.uid).get();
    if (userPermissionDoc.exists) {
      const userPermission = userPermissionDoc.data();
      const hasKMAccess = userPermission?.role === 'vereinsvertreter' || 
                          userPermission?.role === 'km_organisator' ||
                          userPermission?.roles?.includes('km_access');
      
      if (!hasKMAccess) {
        throw new Error('Keine Berechtigung für KM-Verwaltung');
      }
    }
  }
  
  logDebug('Permission granted for:', decodedToken.email);
  return { decodedToken };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PATCH(request, { params });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Validierung
    if (!id || id.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Ungültige Schützen-ID'
      }, { status: 400 });
    }

    await validateUserPermissions(request, id);

    const body = await request.json();
    const { firstName, lastName, birthYear, gender, mitgliedsnummer, clubId, kmClubId } = body;

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (birthYear !== undefined) updateData.birthYear = birthYear;
    if (gender !== undefined) updateData.gender = gender;
    if (mitgliedsnummer !== undefined) updateData.mitgliedsnummer = mitgliedsnummer;
    // Vereinszuordnung nur noch über clubId (kmClubId als Legacy-Fallback im Request).
    const clubIdValue = clubId ?? kmClubId;
    if (clubIdValue !== undefined) updateData.clubId = clubIdValue;
    
    updateData.updatedAt = FieldValue.serverTimestamp();

    await adminDb.collection('shooters').doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Schütze aktualisiert'
    });

  } catch (error: any) {
    logError('Fehler beim Aktualisieren:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Aktualisierung fehlgeschlagen'
    }, { status: error.message?.includes('Berechtigung') ? 403 : 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Keine ID' }, { status: 400 });
    }

    // Echte Auth: Token verifizieren + Berechtigung prüfen (wie bei PATCH).
    await validateUserPermissions(request, id);

    await adminDb.collection('shooters').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Schütze gelöscht'
    });

  } catch (error: any) {
    logError('DELETE Error:', error);
    const isAuth = error.message?.includes('Authentifizierung');
    const isPerm = error.message?.includes('Berechtigung');
    return NextResponse.json({
      success: false,
      error: error.message || 'Fehler'
    }, { status: isAuth ? 401 : isPerm ? 403 : 500 });
  }
}