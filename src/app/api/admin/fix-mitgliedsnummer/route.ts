import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

const ADMIN_EMAIL = 'admin@rwk-einbeck.de';

// Einmaliger Fix: Führende 0 aus mitgliedsnummer entfernen
// z.B. "080170131" → "80170131"
// Nur für Admin zugänglich
export async function POST(request: NextRequest) {
  try {
    // Auth-Check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const snapshot = await adminDb.collection('shooters').get();
    const batch = adminDb.batch();
    let fixed = 0;
    let batchCount = 0;
    const fixedNames: string[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const nr = data.mitgliedsnummer;

      if (nr && typeof nr === 'string' && nr.startsWith('0') && nr.length === 9) {
        const corrected = nr.slice(1);
        batch.update(docSnap.ref, { mitgliedsnummer: corrected });
        fixedNames.push(`${data.firstName} ${data.lastName}: ${nr} → ${corrected}`);
        fixed++;
        batchCount++;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ success: true, fixed, details: fixedNames });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
