import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

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

    // Erstelle den Pfad zum Speichern der Datei
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Erstelle einen sicheren Dateinamen (ersetze Leerzeichen durch Unterstriche)
    const originalName = file.name;
    const safeName = originalName.replace(/\s+/g, '_');
    
    // Erstelle den vollständigen Pfad
    const dirPath = join(process.cwd(), 'public', 'documents', targetDir);
    const filePath = join(dirPath, safeName);
    
    // Stelle sicher, dass das Verzeichnis existiert
    await mkdir(dirPath, { recursive: true });
    
    // Schreibe die Datei
    await writeFile(filePath, buffer);
    
    // Gib den relativen Pfad zurück, der in der JSON-Datei gespeichert werden soll
    const relativePath = `/documents/${targetDir}/${safeName}`;
    
    return NextResponse.json({ 
      success: true, 
      path: relativePath,
      fileName: safeName,
      fileSize: `${Math.round(buffer.length / 1024)} KB`,
      fileType: originalName.endsWith('.pdf') ? 'PDF' : 'Sonstige'
    });
  } catch (error) {
    console.error('Fehler beim Hochladen der Datei:', error);
    return NextResponse.json(
      { error: 'Fehler beim Hochladen der Datei' },
      { status: 500 }
    );
  }
}