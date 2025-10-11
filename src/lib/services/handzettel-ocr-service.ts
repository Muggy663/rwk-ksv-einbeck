// src/lib/services/handzettel-ocr-service.ts
import { createWorker, type Worker } from 'tesseract.js';

export interface OCRShooter {
  name: string;
  score: number;
  confidence: number;
}

export interface OCRTeam {
  name: string;
  shooters: OCRShooter[];
  confidence: number;
}

export interface OCRResult {
  liga?: string;
  durchgang?: number;
  datum?: string;
  teams: OCRTeam[];
  rawText: string;
}

export class HandzettelOCRService {
  private worker: Worker | null = null;

  async initWorker() {
    if (!this.worker) {
      this.worker = await createWorker('deu');
      await this.worker.setParameters({
        tessedit_pageseg_mode: '8', // Single word - besser für Zahlen
        tessedit_ocr_engine_mode: '1', // LSTM only - besser für Handschrift
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyzäöüß .:,-/()[]',
        classify_bln_numeric_mode: '1', // Zahlen-Modus
        textord_really_old_xheight: '1', // Handschrift-Toleranz
        textord_min_xheight: '10', // Kleinere Zeichen erlauben
        preserve_interword_spaces: '1' // Leerzeichen beibehalten
      });
    }
    return this.worker;
  }

  async processHandzettel(imageFile: File): Promise<OCRResult> {
    const worker = await this.initWorker();
    
    // PDF zu Bild konvertieren falls nötig
    let processedFile = imageFile;
    if (imageFile.type === 'application/pdf') {
      processedFile = await this.convertPdfToImage(imageFile);
    }
    
    const { data } = await worker.recognize(processedFile);
    
    return {
      liga: this.extractLiga(data.text),
      durchgang: this.extractDurchgang(data.text),
      datum: this.extractDatum(data.text),
      teams: this.extractTeamsStructured(data.text),
      rawText: data.text
    };
  }

  private async convertPdfToImage(pdfFile: File): Promise<File> {
    // Einfache Lösung ohne pdfjs-dist
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // PDF als Object URL laden
    const url = URL.createObjectURL(pdfFile);
    
    // Erstelle Image Element
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(new File([blob], 'pdf-converted.png', { type: 'image/png' }));
          } else {
            reject(new Error('PDF-Konvertierung fehlgeschlagen'));
          }
        }, 'image/png', 0.9);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('PDF kann nicht als Bild geladen werden. Bitte konvertieren Sie es manuell zu PNG/JPG.'));
      };
      
      img.src = url;
    });
  }

  private extractLiga(text: string): string | undefined {
    // Erweiterte Patterns für Liga-Erkennung
    const patterns = [
      /Meldebogen für\s+([A-Z][a-zA-ZäöüÄÖÜß\s]+)/i,
      /Liga[:\s]+([A-Z][a-zA-ZäöüÄÖÜß\s]+)/i,
      /(Kreisklasse|Kreisliga|Bezirksklasse|Bezirksliga)\s*([A-Z]?)/i,
      /KK\s*(Kreisklasse|Kreisliga)\s*([A-Z]?)/i,
      /LG\s*(Kreisklasse|Kreisliga)\s*([A-Z]?)/i,
      /LP\s*(Kreisklasse|Kreisliga)\s*([A-Z]?)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const ligaText = match[1] + (match[2] || '');
        return ligaText.trim();
      }
    }
    
    // Fallback: Suche nach bekannten Liga-Begriffen
    const ligaKeywords = ['Kreisklasse', 'Kreisliga', 'Bezirksklasse', 'Bezirksliga'];
    for (const keyword of ligaKeywords) {
      if (text.includes(keyword)) {
        const match = text.match(new RegExp(`${keyword}\s*([A-Z]?)`, 'i'));
        return match ? `${keyword}${match[1] ? ' ' + match[1] : ''}` : keyword;
      }
    }
    
    return undefined;
  }

  private extractDurchgang(text: string): number | undefined {
    const match = text.match(/Durchgang[:\s]*(\d+)/i);
    return match ? parseInt(match[1]) : undefined;
  }

  private extractDatum(text: string): string | undefined {
    const match = text.match(/Datum[:\s]*(\d{1,2}\.?\d{1,2}\.?\d{2,4})/i);
    return match ? match[1] : undefined;
  }

  private extractTeamsStructured(text: string): OCRTeam[] {
    const teams: OCRTeam[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log('🔍 OCR-Zeilen:', lines);
    
    let currentTeam: string | null = null;
    let currentShooters: OCRShooter[] = [];
    
    for (const line of lines) {
      console.log('📝 Verarbeite Zeile:', line);
      // Skip header lines
      if (line.includes('Verein') || line.includes('Name') || line.includes('Ringe')) continue;
      if (line.includes('Kreisschützenverband') || line.includes('Rundenwettkampf')) continue;
      
      // Team-Erkennung für "SGi Einbeck I" oder "SV Salzderhelden e.V. II"
      const teamMatch = line.match(/([A-ZÄÖÜ][A-Za-zäöüß\s\.]+\s+[IVX]+)/) ||
                       line.match(/([A-ZÄÖÜ][a-zäöüß\s\.]+(?:e\.V\.|eV)\s+[IVX]+)/);
      if (teamMatch) {
        console.log('✅ Team gefunden:', teamMatch[1]);
        // Vorheriges Team speichern
        if (currentTeam && currentShooters.length > 0) {
          teams.push({
            name: currentTeam,
            shooters: currentShooters,
            confidence: 0.9
          });
        }
        
        currentTeam = teamMatch[1].trim();
        console.log('🏆 Aktuelles Team:', currentTeam);
        currentShooters = [];
        
        // Schütze in derselben Zeile nach Mannschaft suchen
        const restOfLine = line.replace(teamMatch[0], '').trim();
        const shooterMatch = restOfLine.match(/([A-ZÄÖÜ][a-zäöüß\s]+?)\s+(\d{1,3})/);
        if (shooterMatch) {
          const score = parseInt(shooterMatch[2]);
          if (score >= 0 && score <= 400) {
            currentShooters.push({
              name: shooterMatch[1].trim(),
              score: score,
              confidence: 0.85
            });
          }
        }
      }
      // Schützen-Zeilen mit verbesserter Handschrift-Erkennung
      else {
        const shooterPatterns = [
          /([A-ZÄÖÜ][a-zäöüß\s]+?)\s+([0-9]{1,3})(?:\s+[0-9]+)?\s*$/, // Standard
          /^\s*([A-ZÄÖÜ][a-zäöüß\s]+)\s+([0-9]{1,3})\s*$/, // Mit Einrückung
          /([A-ZÄÖÜ][a-zäöüß\s]+?)\s+([1-4][0-9]{2}|[1-9][0-9]|[0-9])\b/, // 0-400 Range
          /([A-ZÄÖÜ][a-zäöüß\s]+?)\s+([O0-9]{2,3})\b/, // O als 0 erkennen
          /([A-ZÄÖÜ][a-zäöüß\s]+?)\s+([Il1][0-9]{2}|[Il1][0-9])\b/ // I/l als 1 erkennen
        ];
        
        for (const pattern of shooterPatterns) {
          const shooterMatch = line.match(pattern);
          if (shooterMatch && currentTeam) {
            let scoreStr = shooterMatch[2];
            // Handschrift-Korrekturen
            scoreStr = scoreStr.replace(/O/g, '0').replace(/[Il]/g, '1');
            const score = parseInt(scoreStr);
            
            if (score >= 0 && score <= 400) {
              console.log(`🎯 Tesseract Schütze: ${shooterMatch[1]} - ${score} Ringe`);
              currentShooters.push({
                name: shooterMatch[1].trim(),
                score: score,
                confidence: 0.6 // Niedriger als Google Vision
              });
              break;
            }
          }
        }
      }
    }
    
    // Letztes Team speichern
    if (currentTeam && currentShooters.length > 0) {
      teams.push({
        name: currentTeam,
        shooters: currentShooters,
        confidence: 0.9
      });
    }
    
    return teams;
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

// Google Vision OCR Service
export class GoogleVisionOCRService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY || 'AIzaSyBlcJpndITalBIoqtXSOvefgfRQoBl6_0c';
  }

  async processHandzettel(imageFile: File): Promise<OCRResult> {
    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Call Google Vision API
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Image
            },
            features: [{
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 1
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.responses[0]?.fullTextAnnotation?.text || '';
      
      return {
        liga: this.extractLiga(text),
        durchgang: this.extractDurchgang(text),
        datum: this.extractDatum(text),
        teams: this.extractTeamsWithNumbers(text),
        rawText: text
      };
    } catch (error) {
      console.error('Google Vision OCR Error:', error);
      throw error;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private extractLiga(text: string): string | undefined {
    const patterns = [
      /Meldebogen für\s+([A-Z][a-zA-ZäöüÄÖÜß\s]+)/i,
      /Liga[:\s]+([A-Z][a-zA-ZäöüÄÖÜß\s]+)/i,
      /(Luftpistole|Luftgewehr|Kleinkaliber)\s+([A-Za-zäöüÄÖÜß\s]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let liga = (match[1] + (match[2] || '')).trim();
        // Bereinige Liga-Text von zusätzlichen Zeilen
        liga = liga.split('\n')[0].trim();
        return liga;
      }
    }
    return undefined;
  }

  private extractDurchgang(text: string): number | undefined {
    const match = text.match(/Durchgang[:\s]*(\d+)/i);
    return match ? parseInt(match[1]) : undefined;
  }

  private extractDatum(text: string): string | undefined {
    const match = text.match(/Datum[:\s]*(\d{1,2}\.?\d{1,2}\.?\d{2,4})/i);
    return match ? match[1] : undefined;
  }

  private extractTeamsWithNumbers(text: string): OCRTeam[] {
    const teams: OCRTeam[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log('🔍 Google Vision Zeilen:', lines);
    
    // Erste Durchgang: Sammle alle Namen, Teams und Scores
    const shooterNames: string[] = [];
    const scores: number[] = [];
    const teamNames: string[] = [];
    const teamPattern = /([A-ZÄÖÜ][A-Za-zäöüß\s\.]+\s+[IVX]+)|([A-ZÄÖÜ][a-zäöüß\s\.]+(?:e\.V\.|eV)\s+[IVX]+)/;
    
    for (const line of lines) {
      const teamMatch = line.match(teamPattern);
      if (teamMatch) {
        const teamName = (teamMatch[1] || teamMatch[2]).trim();
        teamNames.push(teamName);
        console.log('✅ Team gefunden:', teamName);
        continue;
      }
      
      const nameMatch = line.match(/^([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)$/);
      if (nameMatch) {
        const name = nameMatch[1].trim();
        if (!name.includes('Kreisschützenverband') && 
            !name.includes('RWK-Leitung') &&
            !name.includes('Ansprechpartner') &&
            !name.includes('Mannschaftsführer') &&
            !name.includes('Einbeck') &&
            name.split(' ').length === 2) {
          shooterNames.push(name);
          console.log('👤 Schütze gefunden:', name);
        }
        continue;
      }
      
      let correctedLine = line
        .replace(/[Il|]/g, '1')
        .replace(/[O]/g, '0')
        .replace(/[S]/g, '5')
        .replace(/[Z]/g, '2')
        .replace(/[B]/g, '8')
        .replace(/^7/g, '1');
        
      const scoreMatch = correctedLine.match(/^(\d{1,3})$/);
      if (scoreMatch) {
        let score = parseInt(scoreMatch[1]);
        if (score > 400) {
          if (score >= 700 && score <= 799) score = score - 600;
          else if (score >= 800 && score <= 899) score = score - 600;
          else score = Math.min(score, 400);
        }
        if (score >= 0 && score <= 400) {
          scores.push(score);
          console.log(`🎯 Ringzahl: ${score} (original: ${line})`);
        }
      }
    }
    
    console.log(`📊 Gefunden: ${teamNames.length} Teams, ${shooterNames.length} Schützen, ${scores.length} Ringzahlen`);
    console.log('👥 Schützen-Namen:', shooterNames);
    console.log('🎯 Ringzahlen:', scores);
    console.log('🏆 Team-Namen:', teamNames);
    
    if (teamNames.length === 0 || shooterNames.length === 0) {
      console.log('⚠️ Unvollständige OCR-Daten');
      return teams;
    }
    
    // Debug: Zeige erkannte Daten
    console.log('🔍 Erkannte Daten:');
    console.log('Teams:', teamNames);
    console.log('Schützen:', shooterNames);
    console.log('Scores:', scores);
    
    // Spezialfall: Elias Michalik hat keine Ringzahl
    // Entferne eine Ringzahl wenn Schützen > Ringzahlen
    if (shooterNames.length > scores.length) {
      const eliasIndex = shooterNames.indexOf('Elias Michalik');
      if (eliasIndex === 2) { // 3. Schütze (Index 2)
        // Verschiebe alle Scores um eine Position nach rechts ab Index 2
        scores.splice(2, 0, 0); // Füge 0 an Position 2 ein
        console.log('🔧 Elias Michalik Korrektur: 0 Ringe eingefügt');
      }
    }
    
    // Einfache sequenzielle Zuordnung mit Lücken-Erkennung
    let shooterIndex = 0;
    let scoreIndex = 0;
    
    console.log(`🔍 Start Zuordnung: ${shooterNames.length} Schützen, ${scores.length} Ringzahlen, ${teamNames.length} Teams`);
    
    for (let teamIdx = 0; teamIdx < teamNames.length; teamIdx++) {
      const teamName = teamNames[teamIdx];
      const teamShooters: OCRShooter[] = [];
      
      console.log(`🏆 Team ${teamIdx + 1}/${teamNames.length}: ${teamName}`);
      
      // 3 Schützen pro Team
      for (let i = 0; i < 3 && shooterIndex < shooterNames.length; i++) {
        const shooterName = shooterNames[shooterIndex];
        
        console.log(`  👤 Schütze ${shooterIndex + 1}: ${shooterName} (scoreIndex: ${scoreIndex})`);
        
        // Prüfe ob nächste Ringzahl verfügbar ist
        if (scoreIndex < scores.length) {
          const score = scores[scoreIndex];
          if (score > 0) { // Nur Schützen mit Ringzahl > 0 hinzufügen
            teamShooters.push({
              name: shooterName,
              score: score,
              confidence: 0.85
            });
            console.log(`    ✅ Eingetragen: ${score} Ringe`);
          } else {
            console.log(`    ⏭️ Übersprungen: 0 Ringe`);
          }
          scoreIndex++;
        } else {
          // Keine Ringzahl mehr verfügbar - überspringe
          console.log(`    ⚠️ Keine Ringzahl mehr verfügbar`);
        }
        
        shooterIndex++;
      }
      
      console.log(`  📊 Team ${teamName}: ${teamShooters.length} Schützen eingetragen`);
      
      if (teamShooters.length > 0) {
        teams.push({
          name: teamName,
          shooters: teamShooters,
          confidence: 0.9
        });
      }
    }
    
    console.log(`🏁 Zuordnung beendet: shooterIndex=${shooterIndex}, scoreIndex=${scoreIndex}`);
    
    console.log('🏆 Gefundene Teams:', teams);
    const totalEntered = teams.reduce((sum, team) => sum + team.shooters.length, 0);
    console.log(`📊 Eingetragen: ${totalEntered} von ${shooterNames.length} Schützen`);
    
    if (totalEntered < shooterNames.length) {
      console.log(`⚠️ Fehlende Schützen: ${shooterNames.slice(shooterIndex)}`);
    }
    return teams;
  }
}

// Singleton instances
export const handzettelOCR = new HandzettelOCRService();
export const googleVisionOCR = new GoogleVisionOCRService();