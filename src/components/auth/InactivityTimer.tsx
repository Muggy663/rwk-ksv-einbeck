"use client";

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export function InactivityTimer() {
  const { resetInactivityTimer, timeLeft = 0 } = useAuth();
  
  // Zeit formatieren (mm:ss)
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={resetInactivityTimer}
      className="text-xs flex items-center gap-1"
    >
      <Clock className="h-3 w-3" />
      {formattedTime}
    </Button>
  );
}
