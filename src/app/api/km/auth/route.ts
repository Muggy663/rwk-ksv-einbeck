// src/app/api/km/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getKMUserPermission, createKMUserPermission } from '@/lib/services/km-auth-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({
        success: false,
        error: 'User ID ist erforderlich'
      }, { status: 400 });
    }

    const permission = await getKMUserPermission(uid);

    return NextResponse.json({
      success: true,
      data: permission
    });

  } catch (error) {
    console.error('Fehler beim Laden der KM-Berechtigung:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Berechtigung'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, role, clubId, displayName } = body;

    if (!uid || !email || !role) {
      return NextResponse.json({
        success: false,
        error: 'UID, E-Mail und Rolle sind erforderlich'
      }, { status: 400 });
    }

    if (!['km_admin', 'km_organizer', 'verein_vertreter'].includes(role)) {
      return NextResponse.json({
        success: false,
        error: 'Ungültige Rolle'
      }, { status: 400 });
    }

    const success = await createKMUserPermission(uid, email, role, clubId, displayName);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'KM-Berechtigung erfolgreich erstellt'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Fehler beim Erstellen der Berechtigung'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Fehler beim Erstellen der KM-Berechtigung:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Erstellen der Berechtigung'
    }, { status: 500 });
  }
}