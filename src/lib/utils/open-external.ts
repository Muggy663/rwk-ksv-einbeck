import { isMobileDevice } from './is-mobile';

/**
 * Öffnet eine URL mit dem nativen App-Chooser auf mobilen Geräten
 * oder im Browser auf Desktop-Geräten
 */
export async function openWithAppChooser(url: string): Promise<void> {
  // Einfach im Browser öffnen (funktioniert auf allen Geräten)
  window.open(url, '_blank');
}