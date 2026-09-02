import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/utils/secure-logger';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { requireKMAuth } from '@/lib/auth/api-auth';

export async function GET() {
  try {
    const docRef = doc(db, 'system_config', 'mannschaftsregeln');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return NextResponse.json({ regeln: docSnap.data() });
    } else {
      const defaultRegeln = {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        mannschaftsgroesse: 3,
        disziplinRegeln: {},
        altersklassenKombinationen: {
          "Senioren 0": ["Senioren 0", "Seniorinnen 0"],
          "Senioren I+II": ["Senioren I m", "Seniorinnen I", "Senioren II m", "Seniorinnen II"],
          "Senioren III+": ["Senioren III m", "Seniorinnen III", "Senioren IV m", "Seniorinnen IV"],
          "Herren/Damen I": ["Herren I", "Damen I"],
          "Jugend": ["Schüler", "Jugend", "Junioren II m", "Juniorinnen II"]
        }
      };
      return NextResponse.json({ regeln: defaultRegeln });
    }
  } catch (error) {
    logError('Fehler beim Laden der Mannschaftsregeln:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireKMAuth(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { regeln } = await request.json();
    
    regeln.lastUpdated = new Date().toISOString();
    
    const docRef = doc(db, 'system_config', 'mannschaftsregeln');
    await setDoc(docRef, regeln);
    
    return NextResponse.json({ success: true, message: 'Mannschaftsregeln gespeichert' });
  } catch (error) {
    logError('Fehler beim Speichern der Mannschaftsregeln:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
  }
}
