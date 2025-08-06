// src/app/api/km/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { generateMeldelistePDF, generateStartlistePDF, generateLMMeldungenPDF } from '@/lib/services/km-pdf-service';
import type { KMMeldung, KMDisziplin, Shooter, Club, KMMannschaft } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, saison = '2026' } = body;

    if (!['meldeliste', 'startliste', 'lm-meldungen'].includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Ungültiger Export-Typ'
      }, { status: 400 });
    }

    // Lade alle benötigten Daten
    const [meldungenSnapshot, disziplinenSnapshot, schuetzenSnapshot, vereineSnapshot, mannschaftenSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'km_meldungen'), where('saison', '==', saison))),
      getDocs(collection(db, 'km_disziplinen')),
      getDocs(collection(db, 'rwk_shooters')),
      getDocs(collection(db, 'clubs')),
      getDocs(query(collection(db, 'km_mannschaften'), where('saison', '==', saison)))
    ]);

    const meldungen = meldungenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as KMMeldung[];
    const disziplinen = disziplinenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as KMDisziplin[];
    const schuetzen = schuetzenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Shooter[];
    const vereine = vereineSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Club[];
    const mannschaften = mannschaftenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as KMMannschaft[];

    let pdfBlob: Blob;
    let filename: string;

    switch (type) {
      case 'meldeliste':
        pdfBlob = await generateMeldelistePDF(meldungen, disziplinen, schuetzen, vereine);
        filename = `KM2026_Meldeliste_${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      
      case 'startliste':
        pdfBlob = await generateStartlistePDF(mannschaften, disziplinen, schuetzen, vereine);
        filename = `KM2026_Startliste_${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      
      case 'lm-meldungen':
        pdfBlob = await generateLMMeldungenPDF(meldungen, disziplinen, schuetzen, vereine);
        filename = `KM2026_LM_Meldungen_${new Date().toISOString().split('T')[0]}.pdf`;
        break;
      
      default:
        throw new Error('Unbekannter Export-Typ');
    }

    // PDF als Response zurückgeben
    const buffer = await pdfBlob.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('Fehler beim PDF-Export:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim PDF-Export'
    }, { status: 500 });
  }
}
