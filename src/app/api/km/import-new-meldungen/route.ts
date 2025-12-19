import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Importiere die 13 neuen Meldungen zurück...');
    
    // Lade die gesicherten Meldungen
    const backupPath = path.join(process.cwd(), 'neue-meldungen-backup.json');
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    if (!backupData.success || !backupData.meldungen) {
      throw new Error('Backup-Datei ist ungültig');
    }
    
    let importedCount = 0;
    
    for (const meldung of backupData.meldungen) {
      // Importiere mit gleicher ID
      await adminDb.collection('km_meldungen_2026_ld').doc(meldung.id).set(meldung.data);
      importedCount++;
      console.log(`✅ Importiert: ${meldung.id}`);
    }
    
    return NextResponse.json({
      success: true,
      imported: importedCount,
      message: `${importedCount} neue Meldungen erfolgreich re-importiert!`
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}