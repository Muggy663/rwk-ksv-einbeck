import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { uid, email, displayName } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'UID und E-Mail sind erforderlich' },
        { status: 400 }
      );
    }

    await adminDb.collection('user_permissions').doc(uid).set({
      userType: 'INDIVIDUAL',
      email: email,
      displayName: displayName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      permissions: {
        schiessnachweis: true,
        rwk: false,
        km: false,
        admin: false
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Erstellen der user_permissions:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Benutzerberechtigungen' },
      { status: 500 }
    );
  }
}