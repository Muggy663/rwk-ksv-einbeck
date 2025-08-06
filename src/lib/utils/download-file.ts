import { isMobileDevice } from './is-mobile';

/**
 * Lädt eine Datei herunter und funktioniert auch auf mobilen Geräten
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    // Prüfen, ob es sich um ein mobiles Gerät handelt
    if (isMobileDevice()) {
      // Auf mobilen Geräten: PDF im Browser öffnen
      window.open(url, '_blank');
    } else {
      // Auf Desktop-Geräten: normalen Download verwenden
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Fehler beim Herunterladen der Datei:', error);
    // Fallback: Im Browser öffnen
    window.open(url, '_blank');
  }
}
