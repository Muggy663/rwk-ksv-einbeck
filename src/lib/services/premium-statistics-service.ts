// src/lib/services/premium-statistics-service.ts
"use client";

import { SchießEintrag } from "@/types/schiessnachweis";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { de } from "date-fns/locale";

export interface TrendAnalysis {
  trend: 'steigend' | 'stabil' | 'fallend';
  percentage: number;
  description: string;
}

export interface PerformanceMetrics {
  consistency: number; // 0-100
  improvement: number; // Prozent
  bestStreak: number; // Tage
  averageGap: number; // Tage zwischen Trainings
}

export interface ComparisonData {
  disziplin: string;
  durchschnitt: number;
  beste: number;
  schlechteste: number;
  verbesserung: number;
  anzahl: number;
}

export class PremiumStatisticsService {
  
  static getTrendAnalysis(einträge: SchießEintrag[]): TrendAnalysis {
    if (einträge.length < 3) {
      return {
        trend: 'stabil',
        percentage: 0,
        description: 'Zu wenige Daten für Trendanalyse'
      };
    }

    const sortedEntries = einträge.sort((a, b) => a.datum.getTime() - b.datum.getTime());
    const firstHalf = sortedEntries.slice(0, Math.floor(sortedEntries.length / 2));
    const secondHalf = sortedEntries.slice(Math.floor(sortedEntries.length / 2));

    const firstAvg = firstHalf.reduce((sum, e) => sum + e.ergebnis, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.ergebnis, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(change) < 2) {
      return {
        trend: 'stabil',
        percentage: Math.abs(change),
        description: 'Ihre Leistung ist konstant'
      };
    } else if (change > 0) {
      return {
        trend: 'steigend',
        percentage: change,
        description: `Ihre Leistung verbessert sich um ${change.toFixed(1)}%`
      };
    } else {
      return {
        trend: 'fallend',
        percentage: Math.abs(change),
        description: `Ihre Leistung ist um ${Math.abs(change).toFixed(1)}% gesunken`
      };
    }
  }

  static getPerformanceMetrics(einträge: SchießEintrag[]): PerformanceMetrics {
    if (einträge.length < 2) {
      return {
        consistency: 0,
        improvement: 0,
        bestStreak: 0,
        averageGap: 0
      };
    }

    const sortedEntries = einträge.sort((a, b) => a.datum.getTime() - b.datum.getTime());
    
    // Konsistenz berechnen (niedrige Standardabweichung = hohe Konsistenz)
    const avg = sortedEntries.reduce((sum, e) => sum + e.ergebnis, 0) / sortedEntries.length;
    const variance = sortedEntries.reduce((sum, e) => sum + Math.pow(e.ergebnis - avg, 2), 0) / sortedEntries.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - (stdDev / avg) * 100);

    // Verbesserung über Zeit
    const firstQuarter = sortedEntries.slice(0, Math.floor(sortedEntries.length / 4));
    const lastQuarter = sortedEntries.slice(-Math.floor(sortedEntries.length / 4));
    const firstAvg = firstQuarter.reduce((sum, e) => sum + e.ergebnis, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((sum, e) => sum + e.ergebnis, 0) / lastQuarter.length;
    const improvement = ((lastAvg - firstAvg) / firstAvg) * 100;

    // Beste Serie (aufeinanderfolgende Verbesserungen)
    let bestStreak = 0;
    let currentStreak = 0;
    for (let i = 1; i < sortedEntries.length; i++) {
      if (sortedEntries[i].ergebnis >= sortedEntries[i-1].ergebnis) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // Durchschnittlicher Abstand zwischen Trainings
    const gaps = [];
    for (let i = 1; i < sortedEntries.length; i++) {
      const gap = (sortedEntries[i].datum.getTime() - sortedEntries[i-1].datum.getTime()) / (1000 * 60 * 60 * 24);
      gaps.push(gap);
    }
    const averageGap = gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;

    return {
      consistency: Math.round(consistency),
      improvement: Math.round(improvement * 10) / 10,
      bestStreak,
      averageGap: Math.round(averageGap)
    };
  }

  static getDisziplinComparison(einträge: SchießEintrag[]): ComparisonData[] {
    const disziplinMap = new Map<string, SchießEintrag[]>();
    
    einträge.forEach(eintrag => {
      if (!disziplinMap.has(eintrag.disziplin)) {
        disziplinMap.set(eintrag.disziplin, []);
      }
      disziplinMap.get(eintrag.disziplin)!.push(eintrag);
    });

    return Array.from(disziplinMap.entries()).map(([disziplin, entries]) => {
      const ergebnisse = entries.map(e => e.ergebnis);
      const durchschnitt = ergebnisse.reduce((sum, e) => sum + e, 0) / ergebnisse.length;
      const beste = Math.max(...ergebnisse);
      const schlechteste = Math.min(...ergebnisse);
      
      // Verbesserung über Zeit berechnen
      const sortedEntries = entries.sort((a, b) => a.datum.getTime() - b.datum.getTime());
      const firstHalf = sortedEntries.slice(0, Math.floor(sortedEntries.length / 2));
      const secondHalf = sortedEntries.slice(Math.floor(sortedEntries.length / 2));
      
      let verbesserung = 0;
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstAvg = firstHalf.reduce((sum, e) => sum + e.ergebnis, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, e) => sum + e.ergebnis, 0) / secondHalf.length;
        verbesserung = ((secondAvg - firstAvg) / firstAvg) * 100;
      }

      return {
        disziplin,
        durchschnitt: Math.round(durchschnitt * 10) / 10,
        beste,
        schlechteste,
        verbesserung: Math.round(verbesserung * 10) / 10,
        anzahl: entries.length
      };
    }).sort((a, b) => b.durchschnitt - a.durchschnitt);
  }

  static getMonthlyProgress(einträge: SchießEintrag[], months: number = 12) {
    const endDate = new Date();
    const startDate = subMonths(endDate, months - 1);
    const monthsArray = eachMonthOfInterval({ start: startDate, end: endDate });

    return monthsArray.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthEntries = einträge.filter(e => 
        e.datum >= monthStart && e.datum <= monthEnd
      );

      const trainings = monthEntries.filter(e => e.typ === 'training');
      const wettkämpfe = monthEntries.filter(e => e.typ === 'wettkampf');
      
      const avgTraining = trainings.length > 0 
        ? trainings.reduce((sum, e) => sum + e.ergebnis, 0) / trainings.length 
        : 0;
      
      const avgWettkampf = wettkämpfe.length > 0 
        ? wettkämpfe.reduce((sum, e) => sum + e.ergebnis, 0) / wettkämpfe.length 
        : 0;

      const gesamtDurchschnitt = monthEntries.length > 0
        ? monthEntries.reduce((sum, e) => sum + e.ergebnis, 0) / monthEntries.length
        : 0;

      return {
        monat: format(month, 'MMM yyyy', { locale: de }),
        trainings: trainings.length,
        wettkämpfe: wettkämpfe.length,
        avgTraining: Math.round(avgTraining * 10) / 10,
        avgWettkampf: Math.round(avgWettkampf * 10) / 10,
        gesamtDurchschnitt: Math.round(gesamtDurchschnitt * 10) / 10,
        gesamt: monthEntries.length
      };
    });
  }

  static getWeeklyPattern(einträge: SchießEintrag[]) {
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const weekdayData = weekdays.map(day => ({ day, count: 0, avg: 0 }));

    einträge.forEach(eintrag => {
      const dayIndex = eintrag.datum.getDay();
      weekdayData[dayIndex].count++;
    });

    // Durchschnitt pro Wochentag berechnen
    weekdayData.forEach(data => {
      const dayEntries = einträge.filter(e => e.datum.getDay() === weekdays.indexOf(data.day));
      if (dayEntries.length > 0) {
        data.avg = Math.round((dayEntries.reduce((sum, e) => sum + e.ergebnis, 0) / dayEntries.length) * 10) / 10;
      }
    });

    return weekdayData;
  }
}
