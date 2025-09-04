// src/hooks/use-voice-input.ts
"use client";

import { useState, useRef, useCallback } from 'react';

interface VoiceInputOptions {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  continuous?: boolean;
}

export function useVoiceInput({
  onResult,
  onError,
  language = 'de-DE',
  continuous = false
}: VoiceInputOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const initializeRecognition = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return false;
    }

    setIsSupported(true);
    
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // Extrahiere Zahlen aus dem Text
        const numbers = transcript.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          onResult(numbers[0]);
        } else {
          // Versuche deutsche Zahlwörter zu konvertieren
          const germanNumbers: { [key: string]: string } = {
            'null': '0', 'eins': '1', 'zwei': '2', 'drei': '3', 'vier': '4',
            'fünf': '5', 'sechs': '6', 'sieben': '7', 'acht': '8', 'neun': '9',
            'zehn': '10', 'elf': '11', 'zwölf': '12', 'dreizehn': '13',
            'vierzehn': '14', 'fünfzehn': '15', 'sechzehn': '16',
            'siebzehn': '17', 'achtzehn': '18', 'neunzehn': '19', 'zwanzig': '20'
          };
          
          const words = transcript.toLowerCase().split(' ');
          for (const word of words) {
            if (germanNumbers[word]) {
              onResult(germanNumbers[word]);
              return;
            }
          }
          
          onResult(transcript);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        const errorMessage = event.error === 'no-speech' 
          ? 'Keine Sprache erkannt. Bitte versuchen Sie es erneut.'
          : `Sprachfehler: ${event.error}`;
        onError?.(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    
    return true;
  }, [language, continuous, onResult, onError]);

  const startListening = useCallback(() => {
    if (!initializeRecognition()) {
      onError?.('Spracherkennung wird von diesem Browser nicht unterstützt.');
      return;
    }

    try {
      recognitionRef.current?.start();
    } catch (error) {
      onError?.('Fehler beim Starten der Spracherkennung.');
    }
  }, [initializeRecognition, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
}