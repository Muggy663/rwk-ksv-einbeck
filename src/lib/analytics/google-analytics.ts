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

// Get visitor count from API
export const getVisitorCount = async (): Promise<number> => {
  if (typeof window === 'undefined') return 0;
  
  try {
    const response = await fetch('/api/analytics/visitors');
    if (!response.ok) throw new Error('API error');
    
    const data = await response.json();
    return data.totalUsers || 0;
  } catch (error) {
    console.warn('Could not fetch visitor count:', error);
    return 250; // Fallback
  }
};