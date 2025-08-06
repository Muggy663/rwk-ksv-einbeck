// src/lib/analytics/error-tracker.ts
"use client";

interface ErrorReport {
  message: string;
  stack?: string;
  page: string;
  timestamp: number;
  userAgent: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private isEnabled: boolean = true;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers();
    }
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private setupGlobalErrorHandlers() {
    // JavaScript-Fehler abfangen
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        page: window.location.pathname,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        severity: 'high'
      });
    });

    // Promise-Rejections abfangen
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        page: window.location.pathname,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        severity: 'medium'
      });
    });
  }

  // Manuell Fehler tracken
  trackError(error: Partial<ErrorReport>) {
    if (!this.isEnabled) return;

    const errorReport: ErrorReport = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      page: error.page || (typeof window !== 'undefined' ? window.location.pathname : 'unknown'),
      timestamp: error.timestamp || Date.now(),
      userAgent: error.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'),
      userId: error.userId,
      severity: error.severity || 'medium'
    };

    this.storeError(errorReport);
    this.notifyIfCritical(errorReport);
  }

  private storeError(error: ErrorReport) {
    try {
      const stored = JSON.parse(localStorage.getItem('error-reports') || '[]');
      stored.push(error);
      
      // Nur die letzten 50 Fehler behalten
      if (stored.length > 50) {
        stored.splice(0, stored.length - 50);
      }
      
      localStorage.setItem('error-reports', JSON.stringify(stored));
    } catch (storageError) {
      console.warn('Could not store error report:', storageError);
    }
  }

  private notifyIfCritical(error: ErrorReport) {
    if (error.severity === 'critical') {
      // Hier könnte eine E-Mail-Benachrichtigung implementiert werden
      console.error('CRITICAL ERROR DETECTED:', error);
      
      // Optional: API-Call für E-Mail-Benachrichtigung
      this.sendErrorNotification(error);
    }
  }

  private async sendErrorNotification(error: ErrorReport) {
    try {
      await fetch('/api/error-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (notificationError) {
      console.warn('Could not send error notification:', notificationError);
    }
  }

  // Fehlerberichte abrufen
  getErrorReports() {
    if (typeof window === 'undefined') return [];

    try {
      return JSON.parse(localStorage.getItem('error-reports') || '[]');
    } catch (error) {
      return [];
    }
  }

  // Fehlerstatistiken
  getErrorStats() {
    const reports = this.getErrorReports();
    const stats = {
      total: reports.length,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byPage: {} as { [page: string]: number },
      recent: reports.filter((r: ErrorReport) => Date.now() - r.timestamp < 24 * 60 * 60 * 1000).length
    };

    reports.forEach((report: ErrorReport) => {
      stats.bySeverity[report.severity]++;
      stats.byPage[report.page] = (stats.byPage[report.page] || 0) + 1;
    });

    return stats;
  }

  // Fehlerberichte löschen
  clearErrorReports() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error-reports');
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

export const errorTracker = ErrorTracker.getInstance();
