/**
 * Überprüft, ob der Benutzer ein mobiles Gerät verwendet
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Überprüfe User-Agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Überprüfe, ob es sich um ein mobiles Gerät handelt
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Überprüfe, ob es sich um die Capacitor-App handelt
  const isCapacitorApp = (window as any).Capacitor !== undefined;
  
  return mobileRegex.test(userAgent) || isCapacitorApp;
}
