import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    console.log('📊 MIGRATION: Starte Excel-Import...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Keine Datei hochgeladen'
      }, { status: 400 });
    }
    
    // Excel-Datei lesen
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`📋 Excel-Zeilen gefunden: ${data.length}`);
    
    // Lade bestehende Vereine
    const clubsSnapshot = await getDocs(collection(db, 'clubs'));
    const clubs = new Map();
    clubsSnapshot.docs.forEach(doc => {
      const clubData = doc.data();
      const originalName = clubData.name;
      const normalizedName = originalName.trim().replace(/\s+/g, ' ');
      // Alle Varianten speichern
      clubs.set(originalName, doc.id);
      clubs.set(originalName.trim(), doc.id);
      clubs.set(normalizedName, doc.id);
    });
    
    let imported = 0;
    let skipped = 0;
    const errors = [];
    
    // Verarbeite jede Zeile (ab Zeile 2, da Zeile 1 leer/Titel)
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      
      // Überspringe leere Zeilen (zwischen Vereinen)
      if (!row || row.length < 5 || !row[1] || !row[3] || !row[4]) {
        skipped++;
        continue;
      }
      
      try {
        // Excel-Format: A=Mitgliedsnummer, B=Verein, C=Titel, D=Name, E=Vorname, F=Nachsatz, G=Geburtsdatum
        const mitgliedsnummer = row[0] ? String(row[0]).padStart(4, '0') : null; // Führende 0 hinzufügen
        const vereinName = row[1] ? String(row[1]).trim().replace(/\s+/g, ' ') : '';
        const titel = row[2] ? String(row[2]).trim() : '';
        const nachname = row[3] ? String(row[3]).trim() : '';
        const vorname = row[4] ? String(row[4]).trim() : '';
        const nachsatz = row[5] ? String(row[5]).trim() : '';
        const geburtsdatum = row[6];
        
        if (!nachname || !vorname || !vereinName) {
          errors.push(`Zeile ${i + 1}: Fehlende Pflichtdaten`);
          skipped++;
          continue;
        }
        
        // Verein-ID finden (mit flexiblem Matching)
        let clubId = clubs.get(vereinName);
        if (!clubId) {
          // Versuche mit Leerzeichen am Ende
          clubId = clubs.get(vereinName + ' ');
        }
        if (!clubId) {
          // Versuche ohne Leerzeichen am Ende
          clubId = clubs.get(vereinName.replace(/ +$/, ''));
        }
        if (!clubId && vereinName === 'SC Naensen e.V.') {
          // Spezial-Fallback für SC Naensen
          clubId = clubs.get('SC Naensen e.V. ');
        }
        if (!clubId) {
          console.log(`❌ Verein nicht gefunden: "${vereinName}" (Länge: ${vereinName.length})`);
          errors.push(`Zeile ${i + 1}: Verein "${vereinName}" nicht gefunden`);
          skipped++;
          continue;
        }
        
        // Geburtsjahr extrahieren
        let birthYear = null;
        if (geburtsdatum) {
          const dateStr = String(geburtsdatum);
          const yearMatch = dateStr.match(/(\d{4})/);
          if (yearMatch) {
            birthYear = parseInt(yearMatch[1]);
          }
        }
        
        // Geschlecht raten (einfache Heuristik)
        const gender = vorname.toLowerCase().endsWith('a') || 
                      vorname.toLowerCase().includes('ina') ||
                      vorname.toLowerCase().includes('ette') ? 'female' : 'male';
        
        const fullName = `${vorname} ${nachname}`;
        
        // Keine Duplikats-Prüfung - Doppelmitgliedschaften erlaubt
        
        // Schütze erstellen
        const shooterData = {
          firstName: vorname,
          lastName: nachname,
          name: fullName,
          clubId: clubId,
          gender: gender,
          genderGuessed: true,
          teamIds: [],
          isActive: true,
          createdAt: new Date(),
          importedAt: new Date(),
          source: 'migration_excel',
          ...(titel && { title: titel }),
          ...(nachsatz && { suffix: nachsatz }),
          ...(mitgliedsnummer && { mitgliedsnummer: mitgliedsnummer }),
          ...(birthYear && { birthYear: birthYear })
        };
        
        await addDoc(collection(db, 'shooters'), shooterData);
        imported++;
        
        if (imported % 50 === 0) {
          console.log(`✅ Importiert: ${imported} Schützen`);
        }
        
      } catch (error) {
        errors.push(`Zeile ${i + 1}: ${error.message}`);
        skipped++;
      }
    }
    
    console.log(`🎯 MIGRATION ABGESCHLOSSEN: ${imported} importiert, ${skipped} übersprungen`);
    
    return NextResponse.json({
      success: true,
      message: `Import abgeschlossen: ${imported} Schützen importiert`,
      details: {
        imported: imported,
        skipped: skipped,
        total_rows: data.length - 1,
        errors: errors.slice(0, 10) // Nur erste 10 Fehler zeigen
      }
    });
    
  } catch (error) {
    console.error('❌ MIGRATION IMPORT ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}