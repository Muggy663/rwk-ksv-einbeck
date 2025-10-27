"use client";
import { useEffect, useRef, useState } from 'react';

interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
}

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

export function ReCaptcha({ onVerify }: ReCaptchaProps) {
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadRecaptcha = () => {
      if (window.grecaptcha && recaptchaRef.current && !isLoaded) {
        // Prüfe ob bereits gerendert
        if (recaptchaRef.current.children.length > 0) {
          return;
        }
        
        try {
          widgetId.current = window.grecaptcha.render(recaptchaRef.current, {
            sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
            callback: onVerify,
            'expired-callback': () => onVerify(null),
            'error-callback': () => onVerify(null)
          });
          setIsLoaded(true);
        } catch (error) {
          console.warn('reCAPTCHA render error:', error);
        }
      }
    };

    if (window.grecaptcha && window.grecaptcha.render) {
      loadRecaptcha();
    } else {
      window.onRecaptchaLoad = loadRecaptcha;
      
      // Prüfe ob Script bereits existiert
      if (!document.querySelector('script[src*="recaptcha"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (widgetId.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetId.current);
        } catch (error) {
          // Ignore reset errors
        }
      }
    };
  }, [onVerify, isLoaded]);

  return <div ref={recaptchaRef}></div>;
}