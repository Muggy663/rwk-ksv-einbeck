import { isMobileDevice } from './is-mobile';

// Erweitere Window-Interface für Capacitor
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
    };
    // Für direkte Android-Intents
    AndroidInterface?: {
      openPdf: (url: string) => void;
    };
  }
}

/**
 * Öffnet eine URL mit dem nativen App-Chooser auf mobilen Geräten
 * oder im Browser auf Desktop-Geräten
 */
export async function openWithAppChooser(url: string): Promise<void> {
  try {

    
    // Stelle sicher, dass die URL absolut ist
    if (!url.startsWith('http')) {
      const baseUrl = window.location.origin;
      url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

    }
    
    // Prüfe, ob wir in einer nativen App sind
    const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();
    
    if (isNativeApp) {

      
      // Prüfe die Plattform
      const platform = window.Capacitor.getPlatform();

      
      if (platform === 'android') {
        // Für Android: Versuche verschiedene Methoden
        
        // 1. Versuche direkte Android-Bridge (falls implementiert)
        if (window.AndroidInterface && window.AndroidInterface.openPdf) {

          window.AndroidInterface.openPdf(url);
          return;
        }
        
        // 2. Versuche mit location.href (funktioniert oft in WebViews)

        // Erstelle einen Intent-URL für Android
        const intentUrl = `intent:${url}#Intent;action=android.intent.action.VIEW;type=application/pdf;end`;
        window.location.href = intentUrl;
        return;
      } else {
        // Für iOS und andere Plattformen

        window.open(url, '_system');
        return;
      }
    }
    
    // Für mobile Browser
    if (isMobileDevice()) {

      window.open(url, '_blank');
      return;
    }
    
    // Für Desktop-Browser

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
