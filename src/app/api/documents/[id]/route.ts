// src/app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const documentsPath = path.join(process.cwd(), 'public', 'data', 'documents.json');

// Prüft, ob eine Datei existiert
function fileExists(filePath: string): boolean {
  try {
    // Entferne den führenden Slash und füge den public-Pfad hinzu
    const fullPath = path.join(process.cwd(), 'public', filePath.replace(/^\//, ''));
    return fs.existsSync(fullPath);
  } catch (error) {
    console.error('Fehler beim Prüfen der Datei:', error);
    return false;
  }
}

// GET /api/documents/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileContents = fs.readFileSync(documentsPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    const document = data.documents.find((doc: any) => doc.id === params.id);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      );
    }
    
    // Wir prüfen nicht mehr, ob die Datei existiert
    // Der active-Status wird vom Benutzer kontrolliert
    
    return NextResponse.json(document);
  } catch (error) {
    console.error('Fehler beim Lesen des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Lesen des Dokuments' },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updatedDocument = await request.json();
    
    // Lese aktuelle Dokumente
    const fileContents = fs.readFileSync(documentsPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Finde das zu aktualisierende Dokument
    const index = data.documents.findIndex((doc: any) => doc.id === params.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      );
    }
    
    // Prüfe, ob die Datei existiert (für PDF-Dokumente)
    let isActive = updatedDocument.active !== undefined ? updatedDocument.active : data.documents[index].active;
    const fileType = updatedDocument.fileType || data.documents[index].fileType;
    const filePath = updatedDocument.path || data.documents[index].path;
    
    // Entferne die automatische Deaktivierung, wenn die Datei nicht existiert
    // Wir vertrauen der Benutzerentscheidung über den active-Status
    
    // Aktualisiere das Dokument
    data.documents[index] = {
      ...data.documents[index],
      ...updatedDocument,
      id: params.id // Stelle sicher, dass die ID nicht geändert wird
    };
    
    // Schreibe zurück in die Datei
    fs.writeFileSync(documentsPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json(data.documents[index]);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Dokuments' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Lese aktuelle Dokumente
    const fileContents = fs.readFileSync(documentsPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Finde das zu löschende Dokument
    const index = data.documents.findIndex((doc: any) => doc.id === params.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Dokument nicht gefunden' },
        { status: 404 }
      );
    }
    
    // Entferne das Dokument
    const deletedDocument = data.documents[index];
    data.documents.splice(index, 1);
    
    // Schreibe zurück in die Datei
    fs.writeFileSync(documentsPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json(deletedDocument);
  } catch (error) {
    console.error('Fehler beim Löschen des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Dokuments' },
      { status: 500 }
    );
  }
}