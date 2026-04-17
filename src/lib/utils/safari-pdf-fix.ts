/**
 * Safari-spezifische PDF-Fixes
 * Safari hat bekannte Probleme mit PDF-Generierung und Downloads
 */

import { logWarn, logError } from '@/lib/utils/secure-logger';

export function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Safari-optimierte PDF-Download-Funktion
 */
export async function downloadPDFSafari(blob: Blob, fileName: string): Promise<void> {
  try {
    // Erstelle Blob URL
    const url = URL.createObjectURL(blob);
    
    if (isIOS()) {
      // iOS Safari: Öffne in neuem Tab (Download funktioniert nicht zuverlässig)
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        // Fallback: Zeige URL zum manuellen Öffnen
        const userConfirmed = confirm(
          'PDF konnte nicht automatisch geöffnet werden. Möchten Sie den Link kopieren?'
        );
        if (userConfirmed) {
          await navigator.clipboard.writeText(url);
          alert('PDF-Link wurde in die Zwischenablage kopiert. Fügen Sie ihn in einem neuen Tab ein.');
        }
      }
    } else {
      // Desktop Safari: Versuche Download
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        // Safari benötigt das Element im DOM
        document.body.appendChild(link);
        
        // Simuliere Klick
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 1000);
        
      } catch (downloadError) {
        logWarn('Safari Download fehlgeschlagen:', downloadError);
        
        // Fallback: Öffne in neuem Tab
        window.open(url, '_blank');
        
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 5000);
      }
    }
  } catch (error) {
    logError('Safari PDF Download Fehler:', error);
    throw error;
  }
}

/**
 * Zeigt Safari-spezifische Anweisungen für PDF-Probleme
 */
export function showSafariPDFInstructions(): void {
  const instructions = `
Safari PDF-Hinweise:

1. Falls der Download nicht funktioniert, öffnet sich das PDF in einem neuen Tab
2. Zum Speichern: Rechtsklick → "Speichern unter..." oder Cmd+S
3. Für beste Ergebnisse verwenden Sie Chrome oder Firefox
4. Bei Problemen: Popups für diese Seite erlauben

Möchten Sie trotzdem fortfahren?
  `;
  
  return confirm(instructions.trim());
}

/**
 * Safari-optimierte PDF-Generierung mit reduzierten Features
 */
export async function generateSimplePDFForSafari(
  title: string,
  data: any[],
  headers: string[]
): Promise<Blob> {
  // Dynamischer Import für bessere Performance
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Einfache Schriftart für Safari-Kompatibilität
  doc.setFont('helvetica', 'normal');
  
  // Titel
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  // Datum
  doc.setFontSize(10);
  doc.text(`Erstellt: ${new Date().toLocaleDateString('de-DE')}`, 14, 30);
  
  // Einfache Tabelle ohne komplexe Formatierung
  let yPos = 45;
  
  // Header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let xPos = 14;
  headers.forEach((header, index) => {
    doc.text(header, xPos, yPos);
    xPos += 35; // Feste Spaltenbreite für Safari
  });
  
  // Daten
  doc.setFont('helvetica', 'normal');
  yPos += 8;
  
  data.forEach((row, rowIndex) => {
    if (yPos > 190) { // Neue Seite bei Bedarf
      doc.addPage();
      yPos = 20;
    }
    
    xPos = 14;
    headers.forEach((header, colIndex) => {
      const cellValue = row[header] || '-';
      doc.text(String(cellValue), xPos, yPos);
      xPos += 35;
    });
    
    yPos += 6;
  });
  
  // Fußzeile
  doc.setFontSize(6);
  doc.text(
    'Erstellt mit RWK App Einbeck - Safari-optimierte Version',
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );
  
  return doc.output('blob');
}
