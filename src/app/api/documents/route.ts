// src/app/api/documents/route.ts
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

// GET /api/documents
export async function GET() {
  try {
    const fileContents = fs.readFileSync(documentsPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Prüfe für jedes PDF-Dokument, ob die Datei existiert
    data.documents = data.documents.map((doc: any) => {
      if (doc.fileType === 'PDF') {
        const exists = fileExists(doc.path);
        // Wenn die Datei nicht existiert, setze active auf false
        if (!exists) {
          return { ...doc, active: false };
        }
      }
      return doc;
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fehler beim Lesen der Dokumente:', error);
    return NextResponse.json(
      { error: 'Fehler beim Lesen der Dokumente' },
      { status: 500 }
    );
  }
}

// POST /api/documents
export async function POST(request: NextRequest) {
  try {
    const document = await request.json();
    
    // Lese aktuelle Dokumente
    const fileContents = fs.readFileSync(documentsPath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Generiere neue ID
    const newId = (Math.max(...data.documents.map((doc: any) => parseInt(doc.id))) + 1).toString();
    
    // Prüfe, ob die Datei existiert (für PDF-Dokumente)
    let isActive = document.active;
    if (document.fileType === 'PDF') {
      isActive = fileExists(document.path) && document.active;
    }
    
    // Füge neues Dokument hinzu
    const newDocument = {
      id: newId,
      ...document,
      active: isActive
    };
    
    data.documents.push(newDocument);
    
    // Schreibe zurück in die Datei
    fs.writeFileSync(documentsPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json(newDocument);
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Dokuments:', error);
    return NextResponse.json(
      { error: 'Fehler beim Hinzufügen des Dokuments' },
      { status: 500 }
    );
  }
}