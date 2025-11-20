import { NextRequest, NextResponse } from 'next/server';
import { GridFSBucket } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import { secureLogger } from '@/lib/utils/secure-logger';
import { sanitizeInput, validateFileUpload } from '@/lib/utils/input-validator';

// Sichere Konfiguration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];
const ALLOWED_EXTENSIONS = ['.pdf'];

export async function POST(request: NextRequest) {
  try {
    // Content-Length prüfen
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      secureLogger.warn('File too large', 'upload-api');
      return NextResponse.json(
        { error: 'Datei zu groß (max. 10MB)' },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = sanitizeInput(formData.get('category') as string);

    if (!file) {
      secureLogger.warn('No file uploaded', 'upload-api');
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      );
    }

    // Umfassende Datei-Validierung
    const validationResult = validateFileUpload(file, {
      maxSize: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      allowedExtensions: ALLOWED_EXTENSIONS
    });

    if (!validationResult.isValid) {
      secureLogger.warn(`File validation failed: ${validationResult.error}`, 'upload-api');
      return NextResponse.json(
        { error: validationResult.error },
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
    
    // Sichere Datei-Metadaten
    const sanitizedFileName = sanitizeInput(file.name).replace(/[^a-zA-Z0-9.-]/g, '_');
    const uploadStream = bucket.openUploadStream(sanitizedFileName, {
      metadata: {
        originalName: sanitizedFileName,
        contentType: file.type,
        uploadDate: new Date(),
        category: category || 'unknown',
        fileSize: file.size
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
