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
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      console.log('Capacitor erkannt, Plattform:', window.Capacitor.getPlatform());
      
      try {
        // Für PDF-Dateien
        if (url.toLowerCase().endsWith('.pdf')) {
          // Für Android: FileOpener Plugin verwenden
          if (window.Capacitor.getPlatform() === 'android') {
            const { Plugins } = await import('@capacitor/core');
            if (Plugins.FileOpener) {
              // Wenn die URL nicht absolut ist, mache sie absolut
              if (!url.startsWith('http')) {
                const baseUrl = window.location.origin;
                url = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
              }
              
              console.log('Öffne PDF mit FileOpener:', url);
              await Plugins.FileOpener.open({ url, mimeType: 'application/pdf' });
              return;
            }
          }
          
          // Fallback: Browser Plugin verwenden
          const { Browser } = await import('@capacitor/browser');
          console.log('Öffne PDF mit Browser Plugin');
          await Browser.open({ url });
          return;
        } else {
          // Für andere Dateitypen: Browser Plugin verwenden
          const { Browser } = await import('@capacitor/browser');
          console.log('Öffne URL mit Browser Plugin');
          await Browser.open({ url });
          return;
        }
      } catch (capacitorError) {
        console.error('Capacitor Plugin-Fehler:', capacitorError);
        // Fallback: Standard-Browser
        window.open(url, '_blank');
      }
    } else {
      // Nicht in nativer App: Standard-Browser verwenden
      console.log('Öffne im Standard-Browser');
      window.open(url, '_blank');
    }
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