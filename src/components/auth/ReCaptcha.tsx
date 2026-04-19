"use client";
import { useEffect, useRef, useCallback } from 'react';
import { logWarn } from '@/lib/utils/secure-logger';

interface ReCaptchaProps {
  onVerify: (token: string | null) => void;
  onExecuteReady?: (fn: () => void) => void;
}

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

export function ReCaptcha({ onVerify, onExecuteReady }: ReCaptchaProps) {
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const initialized = useRef(false);
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;

  const executeRecaptcha = useCallback(() => {
    if (widgetId.current !== null && window.grecaptcha) {
      try {
        window.grecaptcha.reset(widgetId.current);
        window.grecaptcha.execute(widgetId.current);
      } catch { }
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;

    const init = () => {
      if (!window.grecaptcha?.render || !recaptchaRef.current) return;
      if (initialized.current) return;
      initialized.current = true;

      try {
        widgetId.current = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
          size: 'invisible',
          callback: (token: string) => onVerifyRef.current(token),
          'expired-callback': () => onVerifyRef.current(null),
          'error-callback': () => onVerifyRef.current(null),
        });
        onExecuteReady?.(executeRecaptcha);
        window.grecaptcha.execute(widgetId.current);
      } catch (error) {
        logWarn('reCAPTCHA render error:', error);
        onVerifyRef.current('bypass');
      }
    };

    if (window.grecaptcha?.render) {
      init();
    } else {
      window.onRecaptchaLoad = init;
      if (!document.querySelector('script[src*="recaptcha"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  }, []);

  return <div ref={recaptchaRef} style={{ visibility: 'hidden', position: 'absolute' }}></div>;
}
