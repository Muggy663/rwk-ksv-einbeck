import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Temporär: Leere Listen zurückgeben bis Firebase-Admin-SDK konfiguriert ist
    return NextResponse.json({ compliance: [], spenden: [] });
  } catch (error) {
    console.error('Fehler beim Laden der Gemeinnützigkeitsdaten:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, ...data } = await request.json();
    
    // Temporär: Mock-Response bis Firebase-Admin-SDK konfiguriert ist
    return NextResponse.json({ 
      id: 'mock-id-' + Date.now(), 
      message: 'Eintrag erstellt (Mock)' 
    });
  } catch (error) {
    console.error('Fehler beim Erstellen:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }
}