import { NextRequest, NextResponse } from 'next/server';
import { GridFSBucket, ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Ungültige Datei-ID' },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json(
        { error: 'MongoDB nicht verfügbar' },
        { status: 500 }
      );
    }

    const bucket = new GridFSBucket(db, { bucketName: 'fs' });
    
    // Prüfe ob Datei existiert
    const files = await bucket.find({ _id: new ObjectId(id) }).toArray();
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Datei nicht gefunden' },
        { status: 404 }
      );
    }

    const file = files[0];
    
    // Stream die Datei direkt ohne Buffer-Sammlung für bessere Performance
    const downloadStream = bucket.openDownloadStream(new ObjectId(id));
    
    // Sichere Header-Werte
    const safeFilename = file.filename?.replace(/[^\w.-]/g, '_') || 'document.pdf';
    const contentType = file.metadata?.contentType === 'application/pdf' ? 'application/pdf' : 'application/pdf';
    
    const chunks: Buffer[] = [];
    
    return new Promise((resolve) => {
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        const response = new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${safeFilename}"`,
            'Content-Length': buffer.length.toString(),
          },
        });
        
        resolve(response);
      });
      
      downloadStream.on('error', () => {
        // Sichere Logging ohne sensitive Daten
        console.error('Download Fehler');
        resolve(NextResponse.json(
          { error: 'Fehler beim Herunterladen der Datei' },
          { status: 500 }
        ));
      });
    });

  } catch (error) {
    // Sichere Logging ohne sensitive Daten
    console.error('Download Fehler');
    return NextResponse.json(
      { error: 'Fehler beim Herunterladen der Datei' },
      { status: 500 }
    );
  }
}