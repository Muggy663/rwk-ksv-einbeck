// src/components/mobile/AndroidLayoutFix.tsx
"use client";

import React, { useEffect } from 'react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';

export function AndroidLayoutFix() {
  const { isAndroid, isMobile } = useMobileDetection();

  useEffect(() => {
    if (!isAndroid || !isMobile) return;

    // Keyboard-Detection
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // Keyboard open detection
      const isKeyboardOpen = window.innerHeight < window.screen.height * 0.75;
      document.body.classList.toggle('keyboard-open', isKeyboardOpen);
    };

    // Viewport Height Fix
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Touch-Feedback für alle Buttons
    const addTouchFeedback = () => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      buttons.forEach(button => {
        if (!button.classList.contains('touch-feedback-added')) {
          button.classList.add('touch-feedback-added');
          
          button.addEventListener('touchstart', () => {
            button.classList.add('touch-active');
          });
          
          button.addEventListener('touchend', () => {
            setTimeout(() => {
              button.classList.remove('touch-active');
            }, 150);
          });
        }
      });
    };

    // Initial setup
    setVH();
    addTouchFeedback();

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(setVH, 100);
    });

    // Observer für dynamisch hinzugefügte Buttons
    const observer = new MutationObserver(addTouchFeedback);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [isAndroid, isMobile]);

  if (!isAndroid || !isMobile) return null;

  return (
    <style jsx global>{`
      /* Android-spezifische CSS-Variablen */
      :root {
        --android-vh: calc(var(--vh, 1vh) * 100);
      }
      
      /* Touch-Feedback */
      .touch-active {
        transform: scale(0.98) !important;
        opacity: 0.8 !important;
        transition: all 0.1s ease !important;
      }
      
      /* Keyboard-Anpassungen */
      .keyboard-open {
        height: var(--android-vh) !important;
      }
      
      .keyboard-open .mobile-content {
        height: calc(var(--android-vh) - var(--safe-header-height) - 60px) !important;
        overflow-y: auto !important;
      }
    `}</style>
  );
}