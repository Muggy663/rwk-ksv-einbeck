import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { migrateDocumentsToMongo } from '@/lib/db/document-service-mongo';

// POST /api/migrate
export async function POST(request: NextRequest) {
  try {
    // Lese die Dokumente aus der JSON-Datei
    const documentsPath = path.join(process.cwd(), 'public', 'data', 'documents.json');
    const fileContents = fs.readFileSync(documentsPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Protokolliere die Dokumente für Debugging-Zwecke
    console.log(`Migriere ${data.documents.length} Dokumente zu MongoDB`);
    
    // Migriere die Dokumente zu MongoDB
    const success = await migrateDocumentsToMongo(data.documents);
    
    if (!success) {
      console.error('Migration fehlgeschlagen');
      return NextResponse.json(
        { error: 'Fehler bei der Migration der Dokumente' },
        { status: 500 }
      );
    }
    
    console.log('Migration erfolgreich');
    return NextResponse.json({ 
      success: true,
      message: `${data.documents.length} Dokumente erfolgreich migriert`
    });
  } catch (error) {
    console.error('Fehler bei der Migration:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Migration: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}