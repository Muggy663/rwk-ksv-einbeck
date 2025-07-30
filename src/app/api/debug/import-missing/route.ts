import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    console.log('📊 IMPORT MISSING: Vergleiche Excel mit Datenbank...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }
    
    // 1. Lade bestehende Schützen aus Datenbank
    const existingShootersSnapshot = await getDocs(collection(db, 'rwk_shooters'));
    const existingShooters = existingShootersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Erstelle Set mit Namen für schnellen Vergleich
    const existingNames = new Set(existingShooters.map(s => s.name?.toLowerCase().trim()));
    console.log('🗃️ Bestehende Schützen in DB:', existingShooters.length);
    
    // 2. Lese Excel-Datei
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('📋 Excel-Einträge:', excelData.length);
    
    // 3. Finde fehlende Schützen
    const missingShooters = [];
    
    for (const row of excelData) {
      const name = row['Name'] || row['name'] || row['Schütze'] || '';
      const cleanName = name.toString().toLowerCase().trim();
      
      if (cleanName && !existingNames.has(cleanName)) {
        // Schütze fehlt in Datenbank
        const shooter = {
          name: name.toString().trim(),
          firstName: row['Vorname'] || '',
          lastName: row['Nachname'] || '',
          birthYear: row['Geburtsjahr'] || row['Jahr'] || null,
          gender: row['Geschlecht'] === 'W' ? 'female' : row['Geschlecht'] === 'M' ? 'male' : 'unknown',
          mitgliedsnummer: row['Mitgliedsnummer'] || row['Nr'] || '',
          kmClubId: row['Verein'] || row['Club'] || '',
          importedAt: new Date(),
          source: 'excel_missing_import'
        };
        
        missingShooters.push(shooter);
      }
    }
    
    console.log('❌ Fehlende Schützen gefunden:', missingShooters.length);
    
    // 4. Importiere nur die fehlenden
    let imported = 0;
    for (const shooter of missingShooters) {
      try {
        await addDoc(collection(db, 'rwk_shooters'), shooter);
        imported++;
        console.log('➕ Importiert:', shooter.name);
      } catch (error) {
        console.error('❌ Fehler bei:', shooter.name, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${imported} fehlende Schützen aus Excel importiert`,
      details: {
        existing_in_db: existingShooters.length,
        excel_entries: excelData.length,
        missing_found: missingShooters.length,
        imported: imported,
        total_after: existingShooters.length + imported
      }
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}