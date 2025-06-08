// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Document } from '@/lib/services/document-service';

const documentsPath = path.join(process.cwd(), 'public', 'data', 'documents.json');

// GET /api/documents
export async function GET() {
  try {
    const fileContents = fs.readFileSync(documentsPath, 'utf8');
    const data = JSON.parse(fileContents);
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
    const newId = (Math.max(...data.documents.map((doc: Document) => parseInt(doc.id))) + 1).toString();
    
    // Füge neues Dokument hinzu
    const newDocument = {
      id: newId,
      ...document
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