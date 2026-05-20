import { NextRequest, NextResponse } from 'next/server';
import { logError, logWarn } from '@/lib/utils/secure-logger';
import { verifyApiAuth } from '@/lib/auth/api-auth';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  // SuperAdmin-Authentifizierung erforderlich
  const user = await verifyApiAuth(request);
  if (!user) {
    logWarn('Unauthorized access attempt to license-management', 'license-management-api');
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.email !== 'admin@rwk-einbeck.de') {
    logWarn(`Forbidden access attempt to license-management by ${user.email}`, 'license-management-api');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { action, userEmail, duration } = await request.json();

    if (!userEmail || typeof userEmail !== 'string') {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    // Suche User über Admin SDK (sicherer als Client SDK)
    const userPermissionsRef = adminDb.collection('user_permissions').doc(userEmail);
    const userDoc = await userPermissionsRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };

    switch (action) {
      case 'activate_trial': {
        const trialEnd = new Date();
        trialEnd.setMonth(trialEnd.getMonth() + 3);
        updateData = {
          ...updateData,
          vereinssoftwareLicense: true,
          licenseType: 'TRIAL',
          licenseStartDate: new Date(),
          licenseEndDate: trialEnd,
          trialActivatedAt: new Date()
        };
        break;
      }

      case 'activate_full': {
        updateData = {
          ...updateData,
          vereinssoftwareLicense: true,
          licenseType: 'FULL',
          licenseStartDate: new Date(),
          licenseEndDate: null,
          fullLicenseActivatedAt: new Date()
        };
        break;
      }

      case 'extend_trial': {
        const currentEnd = (userDoc.data()?.licenseEndDate as any)?.toDate?.() || new Date();
        const newEnd = new Date(currentEnd);
        const months = typeof duration === 'number' && duration > 0 ? duration : 1;
        newEnd.setMonth(newEnd.getMonth() + months);
        updateData = {
          ...updateData,
          licenseEndDate: newEnd,
          trialExtendedAt: new Date()
        };
        break;
      }

      case 'deactivate': {
        updateData = {
          ...updateData,
          vereinssoftwareLicense: false,
          licenseType: 'NONE',
          licenseDeactivatedAt: new Date()
        };
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await userPermissionsRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: `Lizenz-Aktion '${action}' für ${userEmail} erfolgreich`
    });

  } catch (error) {
    logError('License management error:', error);
    return NextResponse.json({ error: 'License operation failed' }, { status: 500 });
  }
}
