import { isMobileDevice } from './is-mobile';

/**
 * Öffnet eine URL mit dem nativen App-Chooser auf mobilen Geräten
 * oder im Browser auf Desktop-Geräten
 */
export async function openWithAppChooser(url: string): Promise<void> {
  try {
    // Prüfen, ob die Capacitor-API verfügbar ist (native App)
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
      return;
    }
    
    // Fallback: Im Browser öffnen
    window.open(url, '_blank');
  } catch (error) {
    console.error('Fehler beim Öffnen der URL:', error);
    // Fallback bei Fehler
    window.open(url, '_blank');
  }
}