// src/app/api/km/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getKMUserPermission } from '@/lib/services/km-auth-service';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput } from '@/lib/utils/input-validator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = sanitizeInput(searchParams.get('uid') || '');

    if (!uid || uid.length < 10) {
      secureLogger.warn('Invalid or missing UID', 'km-auth-api');
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
    secureLogger.error('KM permission loading failed', error instanceof Error ? error : undefined, 'km-auth-api');
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Berechtigung'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const uid = sanitizeInput(body.uid);
    const email = sanitizeInput(body.email);
    const role = sanitizeInput(body.role);

    if (!uid || !email || !role) {
      secureLogger.warn('Missing required fields in KM auth creation', 'km-auth-api');
      return NextResponse.json({
        success: false,
        error: 'UID, E-Mail und Rolle sind erforderlich'
      }, { status: 400 });
    }

    const allowedRoles = ['km_admin', 'km_organizer', 'verein_vertreter'];
    if (!allowedRoles.includes(role)) {
      secureLogger.warn('Invalid role in KM auth creation', 'km-auth-api');
      return NextResponse.json({
        success: false,
        error: 'Ungültige Rolle'
      }, { status: 400 });
    }

    // TODO: createKMUserPermission implementieren falls benötigt
    return NextResponse.json({
      success: false,
      error: 'POST-Funktion noch nicht implementiert'
    }, { status: 501 });

  } catch (error) {
    secureLogger.error('KM permission creation failed', error instanceof Error ? error : undefined, 'km-auth-api');
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Erstellen der Berechtigung'
    }, { status: 500 });
  }
}
