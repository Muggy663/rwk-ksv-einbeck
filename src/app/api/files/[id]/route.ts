import { NextRequest, NextResponse } from 'next/server';
import { GridFSBucket, ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput } from '@/lib/utils/input-validator';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = sanitizeInput(rawId);

    // Sichere ID-Validierung
    if (!id || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
      secureLogger.warn('Invalid file ID format', 'files-api');
      return NextResponse.json(
        { error: 'Ungültige Datei-ID' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      secureLogger.warn('Invalid ObjectId', 'files-api');
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
    
    // Sichere Header-Werte - Path Traversal Prevention
    const safeFilename = sanitizeInput(file.filename || 'document.pdf')
      .replace(/[^\w.-]/g, '_')
      .replace(/\.\.+/g, '.')
      .substring(0, 100);
    
    // Nur erlaubte Content-Types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const contentType = allowedTypes.includes(file.metadata?.contentType || '') 
      ? file.metadata!.contentType 
      : 'application/pdf';
    
    const chunks: Buffer[] = [];
    
    return new Promise<NextResponse>((resolve) => {
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
        secureLogger.error('File download stream error', undefined, 'files-api');
        resolve(NextResponse.json(
          { error: 'Fehler beim Herunterladen der Datei' },
          { status: 500 }
        ));
      });
    });

  } catch (error) {
    secureLogger.error('File download failed', undefined, 'files-api');
    return NextResponse.json(
      { error: 'Fehler beim Herunterladen der Datei' },
      { status: 500 }
    );
  }
}