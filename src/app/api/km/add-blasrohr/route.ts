import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getErrorMessage } from '@/lib/utils/secure-logger';

export async function POST(request: NextRequest) {
  try {
    // Prüfe ob Blasrohr bereits existiert
    const existing = await adminDb.collection('km_disziplinen')
      .where('spoNummer', '==', '12.10')
      .get();
    
    if (!existing.empty) {
      return NextResponse.json({
        success: false,
        message: 'Blasrohr 12.10 existiert bereits'
      });
    }
    
    // Füge nur Blasrohr hinzu
    await adminDb.collection('km_disziplinen').add({
      spoNummer: '12.10',
      name: 'Blasrohr',
      nurVereinsmeisterschaft: false,
      auflage: false,
      anmerkung: 'Schüler III 5m, alle anderen 7m. 10 Passen à 6 Pfeile in je 3 Min, nach 5 Passen 10 Min Pause',
      schusszahlen: [
        { 
          schusszahl: 60, 
          altersklassen: ['Alle'], 
          schiesszeit_zuganlagen: 30, 
          schiesszeit_andere: 30 
        }
      ],
      saison: '2026',
      createdAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Blasrohr 12.10 erfolgreich hinzugefügt'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error)
    }, { status: 500 });
  }
}