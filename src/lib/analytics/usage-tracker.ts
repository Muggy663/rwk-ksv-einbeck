// src/lib/analytics/usage-tracker.ts
"use client";

interface PageView {
  page: string;
  timestamp: number;
  userAgent?: string;
  referrer?: string;
}

class UsageTracker {
  private static instance: UsageTracker;
  private isEnabled: boolean = true;

  private constructor() {}

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  // Seitenaufruf tracken (anonym)
  trackPageView(page: string) {
    if (!this.isEnabled || typeof window === 'undefined') return;

    const pageView: PageView = {
      page: this.sanitizePage(page),
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 100), // Gekürzt für Datenschutz
      referrer: document.referrer ? new URL(document.referrer).hostname : undefined
    };

    this.storePageView(pageView);
  }

  // Feature-Nutzung tracken
  trackFeatureUsage(feature: string, action: string = 'used') {
    if (!this.isEnabled || typeof window === 'undefined') return;

    const usage = {
      feature,
      action,
      timestamp: Date.now()
    };

    this.storeFeatureUsage(usage);
  }

  // Performance-Daten tracken
  trackPerformance(page: string, loadTime: number) {
    if (!this.isEnabled || typeof window === 'undefined') return;

    const performance = {
      page: this.sanitizePage(page),
      loadTime,
      timestamp: Date.now()
    };

    this.storePerformance(performance);
  }

  private sanitizePage(page: string): string {
    // Entferne sensible Parameter und IDs
    return page
      .replace(/\/[a-f0-9]{20,}/g, '/[id]') // Firebase IDs
      .replace(/\?.*$/, '') // Query Parameter
      .substring(0, 100); // Länge begrenzen
  }

  private storePageView(pageView: PageView) {
    try {
      const stored = JSON.parse(localStorage.getItem('usage-stats-pages') || '[]');
      stored.push(pageView);
      
      // Nur die letzten 100 Einträge behalten
      if (stored.length > 100) {
        stored.splice(0, stored.length - 100);
      }
      
      localStorage.setItem('usage-stats-pages', JSON.stringify(stored));
    } catch (error) {
      console.warn('Could not store page view:', error);
    }
  }

  private storeFeatureUsage(usage: any) {
    try {
      const stored = JSON.parse(localStorage.getItem('usage-stats-features') || '[]');
      stored.push(usage);
      
      if (stored.length > 50) {
        stored.splice(0, stored.length - 50);
      }
      
      localStorage.setItem('usage-stats-features', JSON.stringify(stored));
    } catch (error) {
      console.warn('Could not store feature usage:', error);
    }
  }

  private storePerformance(performance: any) {
    try {
      const stored = JSON.parse(localStorage.getItem('usage-stats-performance') || '[]');
      stored.push(performance);
      
      if (stored.length > 50) {
        stored.splice(0, stored.length - 50);
      }
      
      localStorage.setItem('usage-stats-performance', JSON.stringify(stored));
    } catch (error) {
      console.warn('Could not store performance data:', error);
    }
  }

  // Statistiken abrufen (für Admin)
  getStats() {
    if (typeof window === 'undefined') return null;

    try {
      return {
        pages: JSON.parse(localStorage.getItem('usage-stats-pages') || '[]'),
        features: JSON.parse(localStorage.getItem('usage-stats-features') || '[]'),
        performance: JSON.parse(localStorage.getItem('usage-stats-performance') || '[]')
      };
    } catch (error) {
      return null;
    }
  }

  // Tracking deaktivieren
  disable() {
    this.isEnabled = false;
  }

  // Tracking aktivieren
  enable() {
    this.isEnabled = true;
  }
}

export const usageTracker = UsageTracker.getInstance();