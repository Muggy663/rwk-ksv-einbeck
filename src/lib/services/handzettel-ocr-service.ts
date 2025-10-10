// src/lib/services/handzettel-ocr-service.ts
import { createWorker } from 'tesseract.js';

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
  private worker: Tesseract.Worker | null = null;

  async initWorker() {
    if (!this.worker) {
      this.worker = await createWorker({
        logger: m => console.log(m), // Vercel-kompatibles Logging
        workerPath: typeof window !== 'undefined' ? '/tesseract/worker.min.js' : undefined,
        corePath: typeof window !== 'undefined' ? '/tesseract/tesseract-core.wasm.js' : undefined
      });
      
      await this.worker.loadLanguage('deu');
      await this.worker.initialize('deu');
      await this.worker.setParameters({
        tessedit_pageseg_mode: '6', // Uniform block of text
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyzäöüß0123456789 .:,-/()[]'
      });
    }
    return this.worker;
  }

  async processHandzettel(imageFile: File): Promise<OCRResult> {
    const worker = await this.initWorker();
    const { data } = await worker.recognize(imageFile);
    
    return {
      liga: this.extractLiga(data.text),
      durchgang: this.extractDurchgang(data.text),
      datum: this.extractDatum(data.text),
      teams: this.extractTeamsStructured(data.text),
      rawText: data.text
    };
  }

  private extractLiga(text: string): string | undefined {
    const patterns = [
      /Meldebogen für\s+([A-Z][a-zA-ZäöüÄÖÜß\s]+)/i,
      /Liga[:\s]+([A-Z][a-zA-ZäöüÄÖÜß\s]+)/i,
      /(Kreisklasse|Kreisliga|Bezirksklasse|Bezirksliga)[A-Za-z\s]*/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
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
    
    let currentTeam: string | null = null;
    let currentShooters: OCRShooter[] = [];
    
    for (const line of lines) {
      // Skip header lines
      if (line.includes('Verein') || line.includes('Name') || line.includes('Ringe')) continue;
      if (line.includes('Kreisschützenverband') || line.includes('Rundenwettkampf')) continue;
      
      // Team-Erkennung (meist mit römischen Zahlen oder Zahlen am Ende)
      const teamMatch = line.match(/^([A-ZÄÖÜ][a-zäöüß\s]+[IVX0-9]+)\s/);
      if (teamMatch) {
        // Vorheriges Team speichern
        if (currentTeam && currentShooters.length > 0) {
          teams.push({
            name: currentTeam,
            shooters: currentShooters,
            confidence: 0.9
          });
        }
        
        currentTeam = teamMatch[1].trim();
        currentShooters = [];
        
        // Schütze in derselben Zeile suchen
        const restOfLine = line.replace(teamMatch[0], '').trim();
        const shooterMatch = restOfLine.match(/([A-ZÄÖÜ][a-zäöüß\s]+)\s+(\d{1,3})$/);
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
      // Schützen-Zeilen (ohne Team-Name, beginnen mit Leerzeichen)
      else {
        const shooterMatch = line.match(/^\s*([A-ZÄÖÜ][a-zäöüß\s]+)\s+(\d{1,3})\s*$/);
        if (shooterMatch && currentTeam) {
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

// Singleton instance
export const handzettelOCR = new HandzettelOCRService();