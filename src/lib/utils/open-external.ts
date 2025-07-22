import { isMobileDevice } from './is-mobile';

// Erweitere Window-Interface für Capacitor
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
    };
  }
}

/**
 * Öffnet eine URL mit dem nativen App-Chooser auf mobilen Geräten
 * oder im Browser auf Desktop-Geräten
 */
export async function openWithAppChooser(url: string): Promise<void> {
  try {
    console.log('Öffne URL:', url);
    
    // Prüfe, ob wir in einer nativen App sind
    const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();
    
    if (isNativeApp) {
      console.log('Native App erkannt');
      
      // Einfache Implementierung für native App
      // Verwende direkt window.open, das wird vom Capacitor WebView abgefangen
      window.open(url, '_system');
      return;
    }
    
    // Für mobile Browser
    if (isMobileDevice()) {
      console.log('Mobiler Browser erkannt');
      window.open(url, '_blank');
      return;
    }
    
    // Für Desktop-Browser
    console.log('Desktop-Browser erkannt');
    window.open(url, '_blank');
  } catch (error) {
    console.error('Fehler beim Öffnen der URL:', error);
    // Letzter Fallback
    try {
      window.open(url, '_blank');
    } catch (finalError) {
      console.error('Finaler Fehler beim Öffnen der URL:', finalError);
    }
  }
}