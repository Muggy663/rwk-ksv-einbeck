"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function InactivityTimer() {
  const { user, resetInactivityTimer } = useAuth();
  const [remainingTime, setRemainingTime] = useState<number>(10 * 60); // 10 Minuten in Sekunden
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Timer nur anzeigen, wenn ein Benutzer angemeldet ist
    if (!user) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setRemainingTime(10 * 60); // Timer zurücksetzen

    // Timer-Intervall
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Event-Listener für Benutzeraktivität
    const handleActivity = () => {
      setRemainingTime(10 * 60);
      if (resetInactivityTimer) {
        resetInactivityTimer();
      }
    };

    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      clearInterval(interval);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, resetInactivityTimer]);

  if (!isVisible) return null;

  // Zeit formatieren (mm:ss)
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center text-sm text-muted-foreground cursor-help">
            <Clock className="h-4 w-4 mr-1" />
            <span>{formattedTime}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Automatische Abmeldung bei Inaktivität</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}