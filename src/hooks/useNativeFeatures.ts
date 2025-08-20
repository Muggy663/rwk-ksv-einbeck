// src/hooks/useNativeFeatures.ts
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export const useNativeFeatures = () => {
  const [isNative, setIsNative] = useState(false);
  const [haptics, setHaptics] = useState<any>(null);
  const [share, setShare] = useState<any>(null);
  const [statusBar, setStatusBar] = useState<any>(null);

  useEffect(() => {
    const initNativeFeatures = async () => {
      if (Capacitor.isNativePlatform()) {
        setIsNative(true);
        
        try {
          // Dynamically import plugins only on native platforms
          const { Haptics } = await import('@capacitor/haptics');
          const { Share } = await import('@capacitor/share');
          const { StatusBar } = await import('@capacitor/status-bar');
          
          setHaptics(Haptics);
          setShare(Share);
          setStatusBar(StatusBar);
          
          // Configure status bar
          await StatusBar.setOverlaysWebView({ overlay: false });
          await StatusBar.setStyle({ style: 'DARK' });
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
        } catch (error) {
          console.warn('Native features not available:', error);
        }
      }
    };

    initNativeFeatures();
  }, []);

  const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (haptics && isNative) {
      try {
        switch (type) {
          case 'light':
            await haptics.impact({ style: 'LIGHT' });
            break;
          case 'medium':
            await haptics.impact({ style: 'MEDIUM' });
            break;
          case 'heavy':
            await haptics.impact({ style: 'HEAVY' });
            break;
        }
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }
  };

  const shareContent = async (title: string, text: string, url?: string) => {
    if (share && isNative) {
      try {
        await share.share({
          title,
          text,
          url,
          dialogTitle: 'RWK Einbeck teilen'
        });
      } catch (error) {
        console.warn('Share failed:', error);
      }
    } else {
      // Fallback for web
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
        } catch (error) {
          console.warn('Web share failed:', error);
        }
      }
    }
  };

  return {
    isNative,
    triggerHaptic,
    shareContent,
    haptics: !!haptics,
    shareAvailable: !!(share || navigator.share)
  };
};