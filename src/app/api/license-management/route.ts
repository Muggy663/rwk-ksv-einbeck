import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { action, userEmail, licenseType, duration } = await request.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 400 });
    }

    const userRef = doc(db, 'user_permissions', userEmail);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: any = {
      updatedAt: new Date()
    };

    switch (action) {
      case 'activate_trial':
        // 3 Monate Testlizenz
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

      case 'activate_full':
        // Vollversion (unbegrenzt)
        updateData = {
          ...updateData,
          vereinssoftwareLicense: true,
          licenseType: 'FULL',
          licenseStartDate: new Date(),
          licenseEndDate: null, // Unbegrenzt
          fullLicenseActivatedAt: new Date()
        };
        break;

      case 'extend_trial':
        // Testzeit verlängern
        const currentEnd = userDoc.data().licenseEndDate?.toDate() || new Date();
        const newEnd = new Date(currentEnd);
        newEnd.setMonth(newEnd.getMonth() + (duration || 1));
        
        updateData = {
          ...updateData,
          licenseEndDate: newEnd,
          trialExtendedAt: new Date()
        };
        break;

      case 'deactivate':
        // Lizenz deaktivieren
        updateData = {
          ...updateData,
          vereinssoftwareLicense: false,
          licenseType: 'NONE',
          licenseDeactivatedAt: new Date()
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await updateDoc(userRef, updateData);

    return NextResponse.json({ 
      success: true, 
      message: `Lizenz-Aktion '${action}' für ${userEmail} erfolgreich`,
      data: updateData
    });

  } catch (error) {
    console.error('License management error:', error);
    return NextResponse.json({ error: 'License operation failed' }, { status: 500 });
  }
}