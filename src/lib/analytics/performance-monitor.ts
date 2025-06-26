// src/lib/analytics/performance-monitor.ts
"use client";

interface PerformanceMetric {
  page: string;
  loadTime: number;
  timestamp: number;
  type: 'page-load' | 'api-call' | 'component-render';
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private startTimes: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Messung starten
  startMeasure(key: string) {
    this.startTimes.set(key, performance.now());
  }

  // Messung beenden und speichern
  endMeasure(key: string, page: string, type: PerformanceMetric['type'] = 'page-load') {
    const startTime = this.startTimes.get(key);
    if (!startTime) return;

    const loadTime = performance.now() - startTime;
    this.startTimes.delete(key);

    const metric: PerformanceMetric = {
      page: this.sanitizePage(page),
      loadTime: Math.round(loadTime),
      timestamp: Date.now(),
      type
    };

    this.storeMetric(metric);

    // Warnung bei langsamen Ladezeiten
    if (loadTime > 3000) {
      console.warn(`Slow ${type} detected:`, page, `${loadTime.toFixed(0)}ms`);
    }
  }

  // Web Vitals messen
  measureWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.storeMetric({
        page: window.location.pathname,
        loadTime: Math.round(lastEntry.startTime),
        timestamp: Date.now(),
        type: 'page-load'
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        this.storeMetric({
          page: window.location.pathname,
          loadTime: Math.round(entry.processingStart - entry.startTime),
          timestamp: Date.now(),
          type: 'component-render'
        });
      });
    }).observe({ entryTypes: ['first-input'] });
  }

  private sanitizePage(page: string): string {
    return page
      .replace(/\/[a-f0-9]{20,}/g, '/[id]')
      .replace(/\?.*$/, '')
      .substring(0, 100);
  }

  private storeMetric(metric: PerformanceMetric) {
    try {
      const stored = JSON.parse(localStorage.getItem('performance-metrics') || '[]');
      stored.push(metric);
      
      // Nur die letzten 100 Metriken behalten
      if (stored.length > 100) {
        stored.splice(0, stored.length - 100);
      }
      
      localStorage.setItem('performance-metrics', JSON.stringify(stored));
    } catch (error) {
      console.warn('Could not store performance metric:', error);
    }
  }

  // Statistiken abrufen
  getMetrics() {
    if (typeof window === 'undefined') return [];

    try {
      return JSON.parse(localStorage.getItem('performance-metrics') || '[]');
    } catch (error) {
      return [];
    }
  }

  // Durchschnittliche Ladezeiten pro Seite
  getAverageLoadTimes() {
    const metrics = this.getMetrics();
    const pageStats: { [page: string]: { total: number; count: number; avg: number } } = {};

    metrics.forEach((metric: PerformanceMetric) => {
      if (!pageStats[metric.page]) {
        pageStats[metric.page] = { total: 0, count: 0, avg: 0 };
      }
      pageStats[metric.page].total += metric.loadTime;
      pageStats[metric.page].count += 1;
    });

    Object.keys(pageStats).forEach(page => {
      pageStats[page].avg = Math.round(pageStats[page].total / pageStats[page].count);
    });

    return pageStats;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();