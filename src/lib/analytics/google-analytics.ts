// src/lib/analytics/google-analytics.ts
"use client";

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;

  // Load gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_TRACKING_ID, {
    anonymize_ip: true, // DSGVO-konform
    cookie_flags: 'SameSite=None;Secure'
  });
};

// Track page views
export const trackPageView = (url: string) => {
  if (!GA_TRACKING_ID || typeof window === 'undefined') return;
  
  window.gtag?.('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// Get visitor count (mock for now - real implementation needs GA Reporting API)
export const getVisitorCount = async (): Promise<number> => {
  // Für jetzt ein Mock-Wert basierend auf deiner App-Popularität
  // In Produktion würdest du die GA Reporting API verwenden
  const baseCount = 12847; // Startwert
  const dailyGrowth = Math.floor(Math.random() * 50) + 20; // 20-70 täglich
  const daysSinceStart = Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));
  
  return baseCount + (dailyGrowth * daysSinceStart);
};