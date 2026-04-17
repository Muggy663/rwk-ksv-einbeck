/**
 * Mobile Debug Utilities für RWK Einbeck App
 * Hilft bei der Diagnose von mobilen OCR-Problemen
 */

import { logDebug, logWarn, logError } from '@/lib/utils/secure-logger';

export interface MobileDebugInfo {
  isMobile: boolean;
  userAgent: string;
  screenSize: string;
  connectionType?: string;
  memoryInfo?: string;
  imageInfo?: {
    size: number;
    type: string;
    dimensions?: string;
  };
}

export class MobileDebugger {
  
  /**
   * Sammelt umfassende Mobile-Debug-Informationen
   */
  static collectDebugInfo(imageFile?: File): MobileDebugInfo {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const info: MobileDebugInfo = {
      isMobile,
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
    };
    
    // Connection Info (falls verfügbar)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        info.connectionType = `${connection.effectiveType || 'unknown'} (${connection.downlink || 'unknown'}Mbps)`;
      }
    }
    
    // Memory Info (falls verfügbar)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        info.memoryInfo = `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`;
      }
    }
    
    // Image Info
    if (imageFile) {
      info.imageInfo = {
        size: imageFile.size,
        type: imageFile.type
      };
    }
    
    return info;
  }
  
  /**
   * Erstellt eine lesbare Debug-Nachricht
   */
  static formatDebugMessage(info: MobileDebugInfo, context?: string): string {
    const lines = [
      `🔍 Mobile Debug${context ? ` (${context})` : ''}:`,
      `📱 Device: ${info.isMobile ? 'Mobile' : 'Desktop'}`,
      `📐 Screen: ${info.screenSize}`,
    ];
    
    if (info.connectionType) {
      lines.push(`🌐 Connection: ${info.connectionType}`);
    }
    
    if (info.memoryInfo) {
      lines.push(`💾 Memory: ${info.memoryInfo}`);
    }
    
    if (info.imageInfo) {
      lines.push(`🖼️ Image: ${Math.round(info.imageInfo.size / 1024)}KB ${info.imageInfo.type}`);
      if (info.imageInfo.dimensions) {
        lines.push(`📏 Dimensions: ${info.imageInfo.dimensions}`);
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * Analysiert ein Bild und fügt Dimensions-Info hinzu
   */
  static async analyzeImage(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        URL.revokeObjectURL(img.src);
      };
      
      img.onerror = () => {
        reject(new Error('Could not analyze image'));
        URL.revokeObjectURL(img.src);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * Prüft ob das Gerät für OCR geeignet ist
   */
  static checkOCRCompatibility(): {
    isCompatible: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Memory Check
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory && memory.jsHeapSizeLimit < 1024 * 1024 * 1024) { // < 1GB
        warnings.push('Wenig verfügbarer Speicher');
        recommendations.push('Schließen Sie andere Browser-Tabs');
      }
    }
    
    // Connection Check
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          warnings.push('Langsame Internetverbindung');
          recommendations.push('Verwenden Sie WLAN für bessere Ergebnisse');
        }
        
        if (connection.saveData) {
          warnings.push('Datensparmodus aktiv');
          recommendations.push('Deaktivieren Sie den Datensparmodus für OCR');
        }
      }
    }
    
    // Screen Size Check (für Mobile)
    if (isMobile && window.screen.width < 360) {
      warnings.push('Sehr kleiner Bildschirm');
      recommendations.push('Verwenden Sie Querformat für bessere Bedienung');
    }
    
    const isCompatible = warnings.length === 0;
    
    return {
      isCompatible,
      warnings,
      recommendations
    };
  }
  
  /**
   * Loggt Debug-Informationen in die Konsole (nur Development)
   */
  static logDebugInfo(info: MobileDebugInfo, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 Mobile Debug${context ? ` - ${context}` : ''}`);
      logDebug('📱 Is Mobile:', info.isMobile);
      logDebug('🖥️ Screen:', info.screenSize);
      logDebug('🌐 User Agent:', info.userAgent.substring(0, 100) + '...');
      
      if (info.connectionType) {
        logDebug('📡 Connection:', info.connectionType);
      }
      
      if (info.memoryInfo) {
        logDebug('💾 Memory:', info.memoryInfo);
      }
      
      if (info.imageInfo) {
        logDebug('🖼️ Image:', `${Math.round(info.imageInfo.size / 1024)}KB ${info.imageInfo.type}`);
        if (info.imageInfo.dimensions) {
          logDebug('📏 Dimensions:', info.imageInfo.dimensions);
        }
      }
      
      console.groupEnd();
    }
  }
}

/**
 * Convenience function für schnelle Mobile-Checks
 */
export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Convenience function für OCR-Kompatibilitätsprüfung
 */
export function checkMobileOCRReadiness(): {
  ready: boolean;
  message: string;
} {
  const compatibility = MobileDebugger.checkOCRCompatibility();
  
  if (compatibility.isCompatible) {
    return {
      ready: true,
      message: '✅ Gerät ist für OCR optimiert'
    };
  }
  
  const message = [
    '⚠️ Mögliche OCR-Probleme erkannt:',
    ...compatibility.warnings.map(w => `• ${w}`),
    '',
    '💡 Empfehlungen:',
    ...compatibility.recommendations.map(r => `• ${r}`)
  ].join('\n');
  
  return {
    ready: false,
    message
  };
}