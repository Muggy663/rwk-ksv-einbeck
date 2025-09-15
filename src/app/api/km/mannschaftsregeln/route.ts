import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const docRef = adminDb.collection('system_config').doc('mannschaftsregeln');
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return NextResponse.json({ regeln: docSnap.data() });
    } else {
      // Erstelle Standard-Regeln und speichere sie
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
      
      // Speichere die Standard-Regeln
      await docRef.set(defaultRegeln);
      
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
    
    const docRef = adminDb.collection('system_config').doc('mannschaftsregeln');
    await docRef.set(regeln);
    
    return NextResponse.json({ success: true, message: 'Mannschaftsregeln gespeichert' });
  } catch (error) {
    console.error('Fehler beim Speichern der Mannschaftsregeln:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
  }
}