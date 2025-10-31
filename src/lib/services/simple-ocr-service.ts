// Vereinfachte OCR-Service ohne Team-Erkennung
import { secureLogger } from '@/lib/utils/secure-logger';

export interface SimpleOCRResult {
  shooters: Array<{
    name: string;
    score: number | null;
    confidence: number;
  }>;
  rawText: string;
}

export class SimpleOCRService {
  async processHandzettel(imageFile: File): Promise<SimpleOCRResult> {
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
}

export const simpleOCR = new SimpleOCRService();