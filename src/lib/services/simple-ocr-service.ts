// Vereinfachte OCR-Service ohne Team-Erkennung
import { secureLogger } from '@/lib/utils/secure-logger';

export interface SimpleOCRShooter {
  name: string;
  score: number | null;
  confidence: number;
}

export interface SimpleOCRResult {
  shooters: SimpleOCRShooter[];
  rawText: string;
}

export class SimpleOCRService {
  async processHandzettel(imageFile: File): Promise<SimpleOCRResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch('/api/vision-ocr', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Vision OCR API request failed');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Vision OCR processing failed');
      }
      
      return {
        shooters: data.shooters,
        rawText: data.rawText
      };
    } catch (error) {
      secureLogger.error('OCR processing failed', error instanceof Error ? error : new Error(String(error)), 'simple-ocr');
      throw error;
    }
  }
}

export const simpleOCR = new SimpleOCRService();
