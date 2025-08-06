"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export function InactivityTimer() {
  const { resetInactivityTimer } = useAuth();
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 Minuten in Sekunden
  
  useEffect(() => {
    // Timer aktualisieren
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    // Timer zurücksetzen bei Benutzeraktivität
    const handleUserActivity = () => {
      if (resetInactivityTimer) {
        resetInactivityTimer();
        setTimeLeft(10 * 60);
      }
    };
    
    // Event-Listener für Benutzeraktivität
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    return () => {
      clearInterval(timer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [resetInactivityTimer]);
  
  // Zeit formatieren (mm:ss)
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => {
        if (resetInactivityTimer) {
          resetInactivityTimer();
          setTimeLeft(10 * 60);
        }
      }}
      className="text-xs flex items-center gap-1"
    >
      <Clock className="h-3 w-3" />
      {formattedTime}
    </Button>
  );
}
