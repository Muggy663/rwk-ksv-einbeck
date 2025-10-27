import { useEffect } from 'react';
import { toast } from 'sonner';

export function useSessionTimeout(isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return;
    let warningTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(warningTimer);
      
      warningTimer = setTimeout(() => {
        toast.warning("Ihre Session läuft in 5 Minuten ab. Klicken Sie hier um zu verlängern.", {
          duration: 300000, // 5 Minuten anzeigen
          action: {
            label: "Verlängern",
            onClick: () => {
              fetch('/api/auth/refresh', { method: 'POST' });
              resetTimer();
            }
          }
        });
      }, 55 * 60 * 1000); // 55 Minuten
    };
    
    const events = ['click', 'keypress', 'scroll', 'mousemove'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });
    
    resetTimer();
    
    return () => {
      clearTimeout(warningTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [isActive]);
}