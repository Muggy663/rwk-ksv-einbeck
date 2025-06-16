import { NextRequest, NextResponse } from 'next/server';
import { GridFSBucket, ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import { Readable } from 'stream';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getMongoDb();
    const bucket = new GridFSBucket(db);
    
    // Suche die Datei in GridFS
    const files = await db.collection('fs.files').find({ _id: new ObjectId(params.id) }).toArray();
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Datei nicht gefunden' },
        { status: 404 }
      );
    }
    
    const file = files[0];
    
    // Erstelle einen Download-Stream
    const downloadStream = bucket.openDownloadStream(new ObjectId(params.id));
    
    // Sammle die Daten aus dem Stream
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(Buffer.from(chunk));
    }
    
    // Kombiniere die Chunks zu einem Buffer
    const buffer = Buffer.concat(chunks);
    
    // Bestimme den Content-Type
    let contentType = 'application/octet-stream';
    if (file.metadata && file.metadata.contentType) {
      contentType = file.metadata.contentType;
    } else if (file.filename.endsWith('.pdf')) {
      contentType = 'application/pdf';
    }
    
    // Erstelle die Response mit dem richtigen Content-Type
    const response = new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${file.filename.split('/').pop()}"`,
        'Content-Length': buffer.length.toString()
      }
    });
    
    return response;
  } catch (error) {
    console.error('Fehler beim Abrufen der Datei:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Datei' },
      { status: 500 }
    );
  }
}