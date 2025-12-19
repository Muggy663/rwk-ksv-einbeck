import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Importiere 13 neue Meldungen in restored-main...');
    
    // Lade die gesicherten Meldungen
    const backupPath = path.join(process.cwd(), 'neue-meldungen-backup.json');
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    if (!backupData.success || !backupData.meldungen) {
      throw new Error('Backup-Datei ist ungültig');
    }
    
    // Einfacher Ansatz: Verwende die normale Firebase Admin Verbindung
    // aber ändere die Datenbank-ID zur Laufzeit
    const admin = require('firebase-admin');
    const app = admin.app(); // Standard App
    
    // Erstelle Firestore-Instanz für restored-main
    const restoredDb = admin.firestore(app);
    
    // HACK: Ändere die Datenbank-ID zur Laufzeit
    restoredDb._settings = { ...restoredDb._settings, databaseId: 'restored-main' };
    
    let importedCount = 0;
    
    for (const meldung of backupData.meldungen) {
      try {
        await restoredDb.collection('km_meldungen_2026_ld').doc(meldung.id).set(meldung.data);
        importedCount++;
        console.log(`✅ Importiert: ${meldung.id}`);
      } catch (error) {
        console.log(`❌ Fehler bei ${meldung.id}:`, error.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      imported: importedCount,
      total: backupData.meldungen.length,
      message: `${importedCount}/${backupData.meldungen.length} Meldungen importiert`
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}