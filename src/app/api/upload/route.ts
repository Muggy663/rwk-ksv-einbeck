import { NextRequest, NextResponse } from 'next/server';
import { GridFSBucket } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import { secureLogger } from '@/lib/utils/secure-logger';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      );
    }

    // Validiere Dateityp
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Nur PDF-Dateien erlaubt' },
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
    
    // Datei in GridFS hochladen
    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        originalName: file.name,
        contentType: file.type,
        uploadDate: new Date(),
        category
      }
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    return new Promise((resolve) => {
      uploadStream.end(buffer, (error) => {
        if (error) {
          // Sichere Logging ohne sensitive Daten
          secureLogger.error('GridFS Upload error', 'upload-api');
          resolve(NextResponse.json(
            { error: 'Fehler beim Hochladen der Datei' },
            { status: 500 }
          ));
          return;
        }

        resolve(NextResponse.json({
          success: true,
          path: `/api/files/${uploadStream.id}`,
          fileSize: `${Math.round(file.size / 1024)} KB`,
          fileType: 'PDF',
          fileId: uploadStream.id.toString()
        }));
      });
    });

  } catch (error) {
    // Sichere Logging ohne sensitive Daten
    secureLogger.error('Upload error', 'upload-api');
    return NextResponse.json(
      { error: 'Fehler beim Hochladen der Datei' },
      { status: 500 }
    );
  }
}