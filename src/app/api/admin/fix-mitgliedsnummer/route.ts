import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Einmaliger Fix: Führende 0 aus mitgliedsnummer entfernen
// z.B. "080170131" → "80170131"
export async function POST(request: NextRequest) {
  try {
    const snapshot = await adminDb.collection('shooters').get();
    const batch = adminDb.batch();
    let fixed = 0;
    let batchCount = 0;
    const fixedNames: string[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const nr = data.mitgliedsnummer;

      // Nur anfassen wenn: String, beginnt mit 0, Länge 9 (080170131)
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
