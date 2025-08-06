import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { GridFSBucket, ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';

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

    // Bestimme den Zielordner basierend auf der Kategorie
    let targetDir = '';
    switch (category) {
      case 'ausschreibung':
        targetDir = 'ausschreibungen';
        break;
      case 'formular':
        targetDir = 'formulare';
        break;
      case 'ordnung':
        targetDir = 'ordnungen';
        break;
      case 'archiv':
        targetDir = 'archiv';
        break;
      default:
        targetDir = 'sonstige';
    }

    // Erstelle einen sicheren Dateinamen (ersetze Leerzeichen durch Unterstriche)
    const originalName = file.name;
    const safeName = originalName.replace(/\s+/g, '_');
    
    // Speichere die Datei in MongoDB GridFS
    const db = await getMongoDb();
    const bucket = new GridFSBucket(db);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Erstelle einen eindeutigen Dateinamen mit Kategorie
    const filename = `${targetDir}/${safeName}`;
    
    // Erstelle einen Upload-Stream
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        category,
        originalName,
        contentType: file.type,
        size: buffer.length,
        uploadDate: new Date()
      }
    });
    
    // Schreibe die Datei in GridFS
    const id = uploadStream.id;
    uploadStream.end(buffer);
    
    // Warte, bis der Upload abgeschlossen ist
    await new Promise<void>((resolve, reject) => {
      uploadStream.on('finish', () => resolve());
      uploadStream.on('error', reject);
    });
    
    // Erstelle auch eine lokale Kopie für die Entwicklung
    if (process.env.NODE_ENV === 'development') {
      try {
        // Erstelle den vollständigen Pfad
        const dirPath = join(process.cwd(), 'public', 'documents', targetDir);
        const filePath = join(dirPath, safeName);
        
        // Stelle sicher, dass das Verzeichnis existiert
        await mkdir(dirPath, { recursive: true });
        
        // Schreibe die Datei
        await writeFile(filePath, buffer);
      } catch (error) {
        console.error('Fehler beim lokalen Speichern der Datei:', error);
        // Wir werfen keinen Fehler, da der Upload zu GridFS erfolgreich war
      }
    }
    
    // Gib den relativen Pfad zurück, der in der JSON-Datei gespeichert werden soll
    const relativePath = `/api/files/${id}`;
    
    return NextResponse.json({ 
      success: true, 
      path: relativePath,
      fileName: safeName,
      fileSize: `${Math.round(buffer.length / 1024)} KB`,
      fileType: originalName.endsWith('.pdf') ? 'PDF' : 'Sonstige',
      fileId: id.toString()
    });
  } catch (error) {
    console.error('Fehler beim Hochladen der Datei:', error);
    return NextResponse.json(
      { error: 'Fehler beim Hochladen der Datei' },
      { status: 500 }
    );
  }
}
