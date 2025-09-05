import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    console.error('Fehler beim Laden der Mannschaftsregeln:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { regeln } = await request.json();
    
    regeln.lastUpdated = new Date().toISOString();
    
    const docRef = doc(db, 'system_config', 'mannschaftsregeln');
    await setDoc(docRef, regeln);
    
    return NextResponse.json({ success: true, message: 'Mannschaftsregeln gespeichert' });
  } catch (error) {
    console.error('Fehler beim Speichern der Mannschaftsregeln:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
  }
}