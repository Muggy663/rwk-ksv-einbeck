import { logError } from '@/lib/utils/secure-logger';

/**
 * Stellt eine erzeugte Datei (Blob) bereit – plattformgerecht:
 *  - Native App (Capacitor): über das Share-Plugin teilen (Datei als
 *    Base64-data-URL). Ein <a download> funktioniert in der WebView NICHT.
 *  - Browser: klassischer Download über ein <a download>-Element.
 *
 * Damit lassen sich PDF-/CSV-Exporte überall nutzen, ohne mobile Geräte
 * pauschal auszusperren.
 *
 * @returns 'shared' | 'downloaded' – wie die Datei bereitgestellt wurde.
 */
export async function shareOrDownloadBlob(
  blob: Blob,
  filename: string,
  mimeType: string,
): Promise<'shared' | 'downloaded'> {
  const isNativeApp =
    typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

  if (isNativeApp) {
    try {
      const { Share } = await import('@capacitor/share');
      const base64 = await blobToBase64(blob);
      await Share.share({
        title: filename,
        url: `data:${mimeType};base64,${base64}`,
        dialogTitle: filename,
      });
      return 'shared';
    } catch (error) {
      logError('Teilen in der App fehlgeschlagen, versuche Download-Fallback:', error);
      // Fällt unten auf den Web-Weg zurück.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
