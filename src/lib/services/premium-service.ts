// src/lib/services/premium-service.ts
"use client";

export interface PremiumFeatures {
  cloudSync: boolean;
  multiDevice: boolean;
  advancedStats: boolean;
  performanceAnalysis: boolean;
  exportOptions: boolean;
}

export interface PremiumSubscription {
  isActive: boolean;
  plan: 'free' | 'premium';
  expiresAt?: Date;
  features: PremiumFeatures;
}

const FREE_FEATURES: PremiumFeatures = {
  cloudSync: false,
  multiDevice: false,
  advancedStats: false,
  performanceAnalysis: false,
  exportOptions: true, // PDF für Behörden bleibt kostenlos
};

const PREMIUM_FEATURES: PremiumFeatures = {
  cloudSync: true,
  multiDevice: true,
  advancedStats: true,
  performanceAnalysis: true,
  exportOptions: true,
};

export class PremiumService {
  private static STORAGE_KEY = 'schiessnachweis_premium';

  static getSubscription(): PremiumSubscription {
    if (typeof window === 'undefined') {
      return {
        isActive: false,
        plan: 'free',
        features: FREE_FEATURES
      };
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return {
          isActive: false,
          plan: 'free',
          features: FREE_FEATURES
        };
      }

      const subscription = JSON.parse(stored);
      
      // Prüfe Ablaufdatum
      if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
        this.cancelSubscription();
        return {
          isActive: false,
          plan: 'free',
          features: FREE_FEATURES
        };
      }

      return {
        ...subscription,
        expiresAt: subscription.expiresAt ? new Date(subscription.expiresAt) : undefined,
        features: subscription.plan === 'premium' ? PREMIUM_FEATURES : FREE_FEATURES
      };
    } catch (error) {
      console.error('Fehler beim Laden der Premium-Subscription:', error);
      return {
        isActive: false,
        plan: 'free',
        features: FREE_FEATURES
      };
    }
  }

  static activatePremium(months: number = 1): void {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    const subscription: PremiumSubscription = {
      isActive: true,
      plan: 'premium',
      expiresAt,
      features: PREMIUM_FEATURES
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subscription));
  }

  static cancelSubscription(): void {
    const subscription: PremiumSubscription = {
      isActive: false,
      plan: 'free',
      features: FREE_FEATURES
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subscription));
  }

  static hasFeature(feature: keyof PremiumFeatures): boolean {
    const subscription = this.getSubscription();
    return subscription.features[feature];
  }

  static isPremium(): boolean {
    const subscription = this.getSubscription();
    return subscription.isActive && subscription.plan === 'premium';
  }

  static getDaysRemaining(): number | null {
    const subscription = this.getSubscription();
    if (!subscription.expiresAt) return null;

    const now = new Date();
    const expires = new Date(subscription.expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }
}