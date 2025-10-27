// src/lib/services/handzettel-ocr-service.ts
import { createWorker, type Worker } from 'tesseract.js';
import { secureLogger } from '@/lib/utils/secure-logger';

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
  ocrMethod?: string;
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
    
    secureLogger.debug('OCR lines processed', 'handzettel-ocr');
    
    let currentTeam: string | null = null;
    let currentShooters: OCRShooter[] = [];
    
    for (const line of lines) {
      secureLogger.debug('Processing OCR line', 'handzettel-ocr');
      // Skip header lines
      if (line.includes('Verein') || line.includes('Name') || line.includes('Ringe')) continue;
      if (line.includes('Kreisschützenverband') || line.includes('Rundenwettkampf')) continue;
      
      // Team-Erkennung für "SGi Einbeck I" oder "SV Salzderhelden e.V. II"
      const teamMatch = line.match(/([A-ZÄÖÜ][A-Za-zäöüß\s\.]+\s+[IVX]+)/) ||
                       line.match(/([A-ZÄÖÜ][a-zäöüß\s\.]+(?:e\.V\.|eV)\s+[IVX]+)/);
      if (teamMatch) {
        secureLogger.debug('Team found in OCR', 'handzettel-ocr');
        // Vorheriges Team speichern
        if (currentTeam && currentShooters.length > 0) {
          teams.push({
            name: currentTeam,
            shooters: currentShooters,
            confidence: 0.9
          });
        }
        
        currentTeam = teamMatch[1].trim();
        secureLogger.debug('Current team set', 'handzettel-ocr');
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
            // Erweiterte Handschrift-Korrekturen
            scoreStr = scoreStr
              .replace(/O/g, '0')
              .replace(/[Il]/g, '1')
              .replace(/S/g, '5')
              .replace(/B/g, '8')
              .replace(/G/g, '6')
              .replace(/Z/g, '2')
              .replace(/C/g, '0');
            const score = parseInt(scoreStr);
            
            if (score >= 0 && score <= 400) {
              secureLogger.debug('Shooter recognized by Tesseract', 'handzettel-ocr');
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
    this.apiKey = process.env.GOOGLE_VISION_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GOOGLE_VISION_API_KEY environment variable is required');
    }
  }

  async processHandzettel(imageFile: File): Promise<OCRResult> {
    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Call Google Vision API with structured detection
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
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1
              },
              {
                type: 'TEXT_DETECTION',
                maxResults: 50
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const fullText = data.responses[0]?.fullTextAnnotation?.text || '';
      const textAnnotations = data.responses[0]?.textAnnotations || [];
      
      // Premium: Strukturbasierte Erkennung mit Koordinaten
      const structuredResult = this.extractStructuredData(textAnnotations);
      
      // Prüfe ob Standard-Handzettel erkannt wurde
      const isStandardHandzettel = this.detectStandardHandzettel(textAnnotations);
      
      if (isStandardHandzettel && structuredResult.teams.length > 0) {
        secureLogger.info('Standard handzettel detected - using premium OCR', 'google-vision');
        return {
          liga: structuredResult.liga || this.extractLiga(fullText),
          durchgang: structuredResult.durchgang || this.extractDurchgang(fullText),
          datum: structuredResult.datum || this.extractDatum(fullText),
          teams: structuredResult.teams,
          rawText: fullText
        };
      } else {
        secureLogger.info('Non-standard handzettel - using fallback OCR', 'google-vision');
        return {
          liga: this.extractLiga(fullText),
          durchgang: this.extractDurchgang(fullText),
          datum: this.extractDatum(fullText),
          teams: this.extractTeamsWithNumbers(fullText),
          rawText: fullText
        };
      }
    } catch (error) {
      secureLogger.error('Google Vision OCR failed', 'google-vision');
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

  private detectStandardHandzettel(textAnnotations: any[]): boolean {
    // Erkenne Standard-Handzettel anhand typischer Merkmale
    const allText = textAnnotations.map(a => a.description).join(' ').toLowerCase();
    
    const standardIndicators = [
      'kreisschützenverband',
      'rundenwettkampf',
      'meldebogen',
      'durchgang',
      'ringe',
      'teiler'
    ];
    
    const foundIndicators = standardIndicators.filter(indicator => 
      allText.includes(indicator)
    ).length;
    
    // Mindestens 3 von 6 Indikatoren müssen vorhanden sein
    const isStandard = foundIndicators >= 3;
    
    // Zusätzlich: Prüfe Layout-Struktur (Header + Team-Bereich)
    const hasHeaderStructure = textAnnotations.some(a => 
      a.boundingPoly && a.boundingPoly.vertices[0].y < 150
    );
    
    const hasTeamStructure = textAnnotations.some(a => 
      a.boundingPoly && a.boundingPoly.vertices[0].y > 150 && a.boundingPoly.vertices[0].y < 800
    );
    
    const result = isStandard && hasHeaderStructure && hasTeamStructure;
    
    secureLogger.debug('Handzettel detection completed', 'google-vision');
    
    return result;
  }
  
  private extractStructuredData(textAnnotations: any[]): { liga?: string, durchgang?: number, datum?: string, teams: OCRTeam[] } {
    secureLogger.debug('Premium structured OCR started', 'google-vision');
    
    // Sortiere Textelemente nach Y-Koordinate (von oben nach unten)
    const sortedTexts = textAnnotations
      .filter(annotation => annotation.boundingPoly && annotation.description)
      .map(annotation => ({
        text: annotation.description,
        x: annotation.boundingPoly.vertices[0].x || 0,
        y: annotation.boundingPoly.vertices[0].y || 0,
        width: (annotation.boundingPoly.vertices[2].x || 0) - (annotation.boundingPoly.vertices[0].x || 0),
        height: (annotation.boundingPoly.vertices[2].y || 0) - (annotation.boundingPoly.vertices[0].y || 0)
      }))
      .sort((a, b) => a.y - b.y);
    
    secureLogger.debug('Text elements with coordinates found', 'google-vision');
    
    // Definiere Handzettel-Layout-Bereiche (basierend auf Standard-Handzettel)
    const layout = {
      header: { yMin: 0, yMax: 150 },        // Liga, Durchgang, Datum
      teamArea: { yMin: 150, yMax: 800 },    // Mannschaften und Schützen
      scoreColumns: [                         // Ringzahl-Spalten (X-Koordinaten)
        { xMin: 400, xMax: 500, label: 'Ringe' },
        { xMin: 500, xMax: 600, label: 'Teiler' },
        { xMin: 600, xMax: 700, label: 'Gesamt' }
      ]
    };
    
    // Extrahiere Header-Informationen
    const headerTexts = sortedTexts.filter(t => t.y <= layout.header.yMax);
    const liga = this.findInTexts(headerTexts, /(Kreisklasse|Kreisliga|Bezirksklasse|Bezirksliga)\s*([A-Z]?)/i);
    const durchgang = this.findNumberInTexts(headerTexts, /Durchgang[:\s]*(\d+)/i);
    const datum = this.findInTexts(headerTexts, /Datum[:\s]*(\d{1,2}\.?\d{1,2}\.?\d{2,4})/i);
    
    // Extrahiere Team-Bereich
    const teamTexts = sortedTexts.filter(t => 
      t.y >= layout.teamArea.yMin && t.y <= layout.teamArea.yMax
    );
    
    secureLogger.debug('Texts found in team area', 'google-vision');
    
    // Gruppiere Texte in Zeilen (ähnliche Y-Koordinaten)
    const rows = this.groupIntoRows(teamTexts, 15); // 15px Toleranz
    secureLogger.debug('Rows recognized in OCR', 'google-vision');
    
    const teams: OCRTeam[] = [];
    let currentTeam: string | null = null;
    let currentShooters: OCRShooter[] = [];
    
    for (const row of rows) {
      const rowText = row.map(t => t.text).join(' ');
      secureLogger.debug('Processing row text', 'google-vision');
      
      // Team-Erkennung (römische Zahlen am Ende)
      const teamMatch = rowText.match(/([A-ZÄÖÜ][A-Za-zäöüß\s\.]+\s+[IVX]+)|([A-ZÄÖÜ][a-zäöüß\s\.]+(?:e\.V\.|eV)\s+[IVX]+)/);
      if (teamMatch) {
        // Speichere vorheriges Team
        if (currentTeam && currentShooters.length > 0) {
          teams.push({
            name: currentTeam,
            shooters: currentShooters,
            confidence: 0.95
          });
        }
        
        currentTeam = (teamMatch[1] || teamMatch[2]).trim();
        currentShooters = [];
        secureLogger.debug('Team recognized', 'google-vision');
        continue;
      }
      
      // Schützen-Erkennung mit Koordinaten-basierter Ringzahl-Zuordnung
      if (currentTeam) {
        const shooterName = this.extractShooterName(row);
        if (shooterName) {
          const score = this.extractScoreFromRow(row, layout.scoreColumns);
          if (score !== null && score >= 0 && score <= 400) {
            currentShooters.push({
              name: shooterName,
              score: score,
              confidence: 0.95
            });
            secureLogger.debug('Shooter recognized with premium OCR', 'google-vision');
          } else {
            secureLogger.debug('Shooter without valid score', 'google-vision');
          }
        }
      }
    }
    
    // Letztes Team speichern
    if (currentTeam && currentShooters.length > 0) {
      teams.push({
        name: currentTeam,
        shooters: currentShooters,
        confidence: 0.95
      });
    }
    
    secureLogger.debug('Premium OCR completed', 'google-vision');
    
    // Validiere Ergebnis - bei zu wenig Daten Fallback signalisieren
    const totalShooters = teams.reduce((sum, t) => sum + t.shooters.length, 0)
    secureLogger.debug('Premium OCR validation', 'google-vision');
    
    if (teams.length === 0 || totalShooters < 10) {
      secureLogger.warn('Premium OCR incomplete - fallback recommended', 'google-vision');
      return { liga, durchgang, datum, teams: [] }; // Leere Teams = Fallback
    }
    
    return { liga, durchgang, datum, teams };
  }
  
  private findInTexts(texts: any[], pattern: RegExp): string | undefined {
    for (const text of texts) {
      const match = text.text.match(pattern);
      if (match) return match[1] + (match[2] || '');
    }
    return undefined;
  }
  
  private findNumberInTexts(texts: any[], pattern: RegExp): number | undefined {
    const result = this.findInTexts(texts, pattern);
    return result ? parseInt(result) : undefined;
  }
  
  private groupIntoRows(texts: any[], tolerance: number): any[][] {
    const rows: any[][] = [];
    const sortedByY = [...texts].sort((a, b) => a.y - b.y);
    
    for (const text of sortedByY) {
      let addedToRow = false;
      
      for (const row of rows) {
        const avgY = row.reduce((sum, t) => sum + t.y, 0) / row.length;
        if (Math.abs(text.y - avgY) <= tolerance) {
          row.push(text);
          row.sort((a, b) => a.x - b.x); // Sortiere nach X-Koordinate
          addedToRow = true;
          break;
        }
      }
      
      if (!addedToRow) {
        rows.push([text]);
      }
    }
    
    return rows;
  }
  
  private extractShooterName(row: any[]): string | null {
    // Suche nach Namen-Pattern in der Zeile (meist am Anfang)
    const nameTexts = row.filter(t => t.x < 300); // Namen stehen links
    const nameText = nameTexts.map(t => t.text).join(' ');
    
    // Erweiterte Namen-Patterns für bessere Erkennung
    const namePatterns = [
      /([A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?\s+[A-ZÄÖÜ][a-zäöüß]+)/,  // Hans-Joachim Hinz
      /([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)/,  // Standard: Vorname Nachname
      /([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)/ // Drei Namen
    ];
    
    for (const pattern of namePatterns) {
      const nameMatch = nameText.match(pattern);
      if (nameMatch) {
        return nameMatch[1].trim();
      }
    }
    
    return null;
  }
  
  private extractScoreFromRow(row: any[], scoreColumns: any[]): number | null {
    // Suche in den definierten Ringzahl-Spalten
    for (const column of scoreColumns) {
      const scoreTexts = row.filter(t => t.x >= column.xMin && t.x <= column.xMax);
      
      for (const scoreText of scoreTexts) {
        let text = scoreText.text
          .replace(/[Il|]/g, '1')
          .replace(/[O]/g, '0')
          .replace(/[S]/g, '5')
          .replace(/[B]/g, '8')
          .replace(/[G]/g, '6')
          .replace(/[D]/g, '0')
          .replace(/[T]/g, '7')
          .replace(/[A]/g, '4')
          .replace(/[Z]/g, '2')
          .replace(/[C]/g, '0');
        
        const scoreMatch = text.match(/^(\d{1,3})$/);
        if (scoreMatch) {
          let score = parseInt(scoreMatch[1]);
          
          // Korrigiere häufige OCR-Fehler
          if (score > 400) {
            if (score >= 700 && score <= 799) score = score - 600;
            else if (score >= 800 && score <= 899) score = score - 600;
            else score = Math.min(score, 400);
          }
          
          if (score >= 0 && score <= 400) {
            secureLogger.debug('Score found in column', 'google-vision');
            return score;
          }
        }
      }
    }
    
    return null;
  }
  
  private fuzzyMatch(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[^a-z]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z]/g, '');
    
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // Levenshtein distance
    const matrix = [];
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    const distance = matrix[s2.length][s1.length];
    return 1 - distance / Math.max(s1.length, s2.length);
  }

  private extractTeamsWithNumbers(text: string): OCRTeam[] {
    const teams: OCRTeam[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    secureLogger.debug('Google Vision lines processed', 'google-vision');
    
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
        secureLogger.debug('Team found', 'google-vision');
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
            !name.includes('Datum') &&
            !name.includes('Durchgang') &&
            name.split(' ').length === 2 &&
            !shooterNames.includes(name)) { // Duplikat-Prüfung
          shooterNames.push(name);
          secureLogger.debug('Shooter found', 'google-vision');
        }
        continue;
      }
      
      let correctedLine = line
        .replace(/[Il|]/g, '1')
        .replace(/[O]/g, '0')
        .replace(/[S]/g, '5')
        .replace(/[B]/g, '8')
        .replace(/[G]/g, '6')
        .replace(/[D]/g, '0')
        .replace(/[T]/g, '7')
        .replace(/[A]/g, '4')
        .replace(/[Z]/g, '2')
        .replace(/[C]/g, '0');
        
      const scoreMatch = correctedLine.match(/^(\d{1,3})$/);
      if (scoreMatch) {
        let score = parseInt(scoreMatch[1]);
        const originalScore = score;
        
        // Korrigiere häufige OCR-Fehler bei Zahlen
        if (score > 400) {
          if (score >= 700 && score <= 799) score = score - 600; // 7xx -> 1xx
          else if (score >= 800 && score <= 899) score = score - 600; // 8xx -> 2xx
          else if (score >= 600 && score <= 699) score = score - 600; // 6xx -> 0xx
          else if (score >= 900 && score <= 999) score = score - 600; // 9xx -> 3xx
          else score = Math.min(score, 400);
        }
        
        // Weitere Korrekturen für typische Handschrift-Fehler
        if (score < 50 && originalScore > 100) {
          // Wahrscheinlich falsch erkannt, versuche andere Interpretation
          const scoreStr = originalScore.toString();
          if (scoreStr.startsWith('8')) score = parseInt('9' + scoreStr.slice(1));
          else if (scoreStr.startsWith('6')) score = parseInt('9' + scoreStr.slice(1));
        }
        
        // Validiere finalen Score
        if (score >= 0 && score <= 400) {
          scores.push(score);
          if (originalScore !== score) {
            secureLogger.debug('Score corrected', 'google-vision');
          } else {
            secureLogger.debug('Score recognized', 'google-vision');
          }
        } else {
          secureLogger.debug('Invalid score ignored', 'google-vision');
        }
      }
    }
    
    secureLogger.debug('OCR extraction summary', 'google-vision');
    
    if (teamNames.length === 0 || shooterNames.length === 0) {
      secureLogger.warn('Incomplete OCR data', 'google-vision');
      return teams;
    }
    
    secureLogger.debug('Recognized data summary', 'google-vision');
    
    // Lücken-Erkennung: Wenn mehr Schützen als Ringzahlen vorhanden sind
    if (shooterNames.length > scores.length) {
      secureLogger.debug('Gap detected in OCR data', 'google-vision');
      
      // Füge 0-Werte für fehlende Ringzahlen hinzu
      const missingScores = shooterNames.length - scores.length;
      for (let i = 0; i < missingScores; i++) {
        // Versuche intelligente Position zu finden
        const insertPosition = Math.min(scores.length, shooterNames.length - missingScores + i);
        scores.splice(insertPosition, 0, 0);
        secureLogger.debug('Gap filled with zero score', 'google-vision');
      }
    }
    
    // Zu viele Ringzahlen: Entferne die niedrigsten oder offensichtlich falschen
    if (scores.length > shooterNames.length) {
      secureLogger.debug('Too many scores detected', 'google-vision');
      
      // Entferne Ringzahlen > 400 oder sehr niedrige Werte < 50
      const validScores = scores.filter(score => score >= 50 && score <= 400);
      if (validScores.length === shooterNames.length) {
        scores.length = 0;
        scores.push(...validScores);
        secureLogger.debug('Invalid scores removed', 'google-vision');
      } else {
        // Entferne überschüssige Ringzahlen vom Ende
        scores.splice(shooterNames.length);
        secureLogger.debug('Excess scores removed', 'google-vision');
      }
    }
    
    // Präzise zweistufige Zuordnung mit strikten Team-Grenzen
    secureLogger.debug('Precise team-shooter assignment started', 'google-vision');
    
    interface TempShooter { name: string; lineIndex: number; }
    interface TempScore { value: number; lineIndex: number; }
    interface TempTeam { name: string; lineIndex: number; }
    
    const tempShooters: TempShooter[] = [];
    const tempScores: TempScore[] = [];
    const tempTeams: TempTeam[] = [];
    
    // Stufe 1: Präzise Extraktion mit verbesserter Filterung
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Erweiterte Ringzahl-Erkennung (2-3 Ziffern, 0-400 Bereich)
      const scoreMatch = trimmed.match(/^(\d{2,3})$/);
      if (scoreMatch) {
        const score = parseInt(scoreMatch[1]);
        if (score >= 0 && score <= 400) {
          tempScores.push({ value: score, lineIndex: index });
          secureLogger.debug('Score recognized in line', 'google-vision');
          return;
        }
      }
      
      // Verbesserte Namen-Erkennung mit strengerer Filterung
      const namePatterns = [
        /^([A-ZÄÖÜ][a-zäöüß]+(?:-[A-ZÄÖÜ][a-zäöüß]+)?\s+[A-ZÄÖÜ][a-zäöüß]+)(?:\s+\w{1,3})?$/, // Hans-Joachim Hinz wit
        /^([A-ZÄÖÜ][a-zäöüß]+\s+[A-ZÄÖÜ][a-zäöüß]+)$/ // Standard: Vorname Nachname
      ];
      
      for (const pattern of namePatterns) {
        const nameMatch = trimmed.match(pattern);
        if (nameMatch && 
            !trimmed.includes('Ansprechpartner') && 
            !trimmed.includes('Kreisschützenverband') && 
            !trimmed.includes('e.V.') &&
            !trimmed.includes('Einbeck') &&
            !trimmed.includes('RWK') &&
            !trimmed.includes('Datum') &&
            !trimmed.includes('Uhrzeit') &&
            trimmed.length > 5) {
          const cleanName = nameMatch[1].trim();
          tempShooters.push({ name: cleanName, lineIndex: index });
          secureLogger.debug('Shooter recognized in line', 'google-vision');
          return;
        }
      }
      
      // Team-Erkennung
      const teamMatch = trimmed.match(/([A-ZÄÖÜ][A-Za-zäöüß\s\.]+\s+[IVX]+)|([A-ZÄÖÜ][a-zäöüß\s\.]+(?:e\.V\.|eV)\s+[IVX]+)/);
      if (teamMatch) {
        const cleanName = (teamMatch[1] || teamMatch[2]).replace(/\s+\d{3}$/, '').trim();
        tempTeams.push({ name: cleanName, lineIndex: index });
        secureLogger.debug('Team recognized in line', 'google-vision');
      }
    });
    
    secureLogger.debug('Extraction completed with line indices', 'google-vision');
    
    // Stufe 2: Präzise Team-Zuordnung mit Used-Tracking
    const usedShooters = new Set<number>();
    const usedScores = new Set<number>();
    
    tempTeams.forEach((team, i) => {
      const teamLine = team.lineIndex;
      const nextTeamLine = tempTeams[i + 1] ? tempTeams[i + 1].lineIndex : lines.length;
      
      secureLogger.debug('Analyzing team block', 'google-vision');
      
      // Sammle Schützen VOR und NACH dem Team (bis zum nächsten Team)
      const candidateShooters = tempShooters.filter(s => 
        !usedShooters.has(s.lineIndex) && 
        ((s.lineIndex < teamLine && s.lineIndex > (tempTeams[i-1]?.lineIndex || 0)) || // VOR Team
         (s.lineIndex > teamLine && s.lineIndex < nextTeamLine)) // NACH Team
      );
      
      const teamScores = tempScores.filter(s => 
        !usedScores.has(s.lineIndex) && 
        s.lineIndex > (tempTeams[i-1]?.lineIndex || 0) && 
        s.lineIndex < nextTeamLine
      );
      
      const elementsInBlock = [
        ...candidateShooters.map(s => ({...s, type: 'shooter'})),
        ...teamScores.map(s => ({...s, type: 'score'}))
      ].sort((a, b) => a.lineIndex - b.lineIndex);
      
      secureLogger.debug('Block elements identified', 'google-vision');
      
      const teamShooters: OCRShooter[] = [];
      
      // Lokale Zuordnung innerhalb des Team-Blocks
      const localUsedScores = new Set<number>();
      
      elementsInBlock.forEach((element, index) => {
        if (element.type === 'shooter') {
          // Finde nächsten Score nach diesem Schützen (auch außerhalb des Blocks)
          let bestScore: any = null;
          let minDistance = Infinity;
          
          // Suche zuerst im Block
          elementsInBlock.forEach((candidate, candidateIndex) => {
            if (candidate.type === 'score' && 
                candidateIndex > index && 
                !usedScores.has(candidate.lineIndex)) {
              const distance = candidate.lineIndex - element.lineIndex;
              if (distance < minDistance) {
                minDistance = distance;
                bestScore = candidate;
              }
            }
          });
          
          // Falls kein Score im Block, suche in verfügbaren globalen Scores
          if (!bestScore) {
            tempScores.forEach(candidate => {
              if (candidate.lineIndex > element.lineIndex && 
                  !usedScores.has(candidate.lineIndex) &&
                  !localUsedScores.has(candidate.lineIndex)) {
                const distance = candidate.lineIndex - element.lineIndex;
                if (distance < minDistance) {
                  minDistance = distance;
                  bestScore = candidate;
                }
              }
            });
          }
          
          if (bestScore) {
            usedScores.add(bestScore.lineIndex);
            localUsedScores.add(bestScore.lineIndex);
            usedShooters.add(element.lineIndex);
            teamShooters.push({
              name: element.name,
              score: bestScore.value,
              confidence: 0.95
            });
            secureLogger.debug('Shooter-score assignment completed', 'google-vision');
          } else {
            secureLogger.debug('No score found for shooter', 'google-vision');
          }
        }
      });
      
      if (teamShooters.length > 0) {
        teams.push({
          name: team.name,
          shooters: teamShooters,
          confidence: 0.95
        });
        secureLogger.debug('Team processing completed', 'google-vision');
      }
    });
    
    secureLogger.debug('Precise OCR final results', 'google-vision');
    return teams;
  }
}

// Singleton instances
export const handzettelOCR = new HandzettelOCRService();
export const googleVisionOCR = new GoogleVisionOCRService();