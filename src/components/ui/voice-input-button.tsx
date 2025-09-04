// src/components/ui/voice-input-button.tsx
"use client";

import React from 'react';
import { Button } from './button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  disabled?: boolean;
}

export function VoiceInputButton({
  onResult,
  className,
  size = 'default',
  variant = 'outline',
  disabled = false
}: VoiceInputButtonProps) {
  const { toast } = useToast();

  const { isListening, isSupported, startListening, stopListening } = useVoiceInput({
    onResult: (text) => {
      onResult(text);
      toast({
        title: "Spracheingabe erfolgreich",
        description: `Erkannt: "${text}"`,
        duration: 2000
      });
    },
    onError: (error) => {
      toast({
        title: "Spracheingabe-Fehler",
        description: error,
        variant: "destructive",
        duration: 3000
      });
    }
  });

  if (!isSupported) {
    return null; // Verstecke Button wenn nicht unterstützt
  }

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "transition-all duration-200",
        isListening && "bg-red-500 hover:bg-red-600 text-white animate-pulse",
        className
      )}
      title={isListening ? "Spracheingabe stoppen" : "Spracheingabe starten"}
    >
      {isListening ? (
        <>
          <MicOff className="h-4 w-4" />
          <span className="sr-only">Spracheingabe stoppen</span>
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          <span className="sr-only">Spracheingabe starten</span>
        </>
      )}
    </Button>
  );
}