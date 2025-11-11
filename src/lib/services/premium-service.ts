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
  autoRenew?: boolean;
  paymentMethod?: 'monthly' | 'yearly' | 'trial';
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

  static async getSubscription(): Promise<PremiumSubscription> {
    if (typeof window === 'undefined') {
      return {
        isActive: false,
        plan: 'free',
        features: FREE_FEATURES
      };
    }

    try {
      // Prüfe Firebase zuerst
      const firebaseSubscription = await this.getFirebaseSubscription();
      if (firebaseSubscription) {
        return firebaseSubscription;
      }

      // Fallback zu localStorage
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

  private static async getFirebaseSubscription(): Promise<PremiumSubscription | null> {
    try {
      const { auth, db } = await import('@/lib/firebase/config');
      const { doc, getDoc } = await import('firebase/firestore');
      
      if (!auth.currentUser) return null;
      
      const userDoc = await getDoc(doc(db, 'user_permissions', auth.currentUser.uid));
      if (!userDoc.exists()) return null;
      
      const userData = userDoc.data();
      if (!userData.isPremium) return null;
      
      const expiresAt = userData.premiumUntil ? userData.premiumUntil.toDate() : null;
      
      // Prüfe Ablauf
      if (expiresAt && expiresAt < new Date()) {
        return {
          isActive: false,
          plan: 'free',
          features: FREE_FEATURES
        };
      }
      
      return {
        isActive: true,
        plan: 'premium',
        expiresAt,
        features: PREMIUM_FEATURES,
        autoRenew: userData.autoRenew || false,
        paymentMethod: userData.paymentMethod || 'unknown'
      };
    } catch (error) {
      console.error('Firebase Premium-Check fehlgeschlagen:', error);
      return null;
    }
  }

  static activatePremium(type: 'monthly' | 'days' = 'monthly', value: number = 1, autoRenew: boolean = false): void {
    const expiresAt = new Date();
    
    if (type === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + value);
    } else {
      expiresAt.setDate(expiresAt.getDate() + value);
    }

    const subscription: PremiumSubscription = {
      isActive: true,
      plan: 'premium',
      expiresAt,
      features: PREMIUM_FEATURES,
      autoRenew,
      paymentMethod: type === 'monthly' ? 'monthly' : 'trial'
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

  static async isPremium(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription.isActive && subscription.plan === 'premium';
  }

  // Synchrone Version für Backward-Compatibility
  static isPremiumSync(): boolean {
    // Nur localStorage prüfen für synchrone Aufrufe
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;
      
      const subscription = JSON.parse(stored);
      if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
        return false;
      }
      
      return subscription.isActive && subscription.plan === 'premium';
    } catch {
      return false;
    }
  }

  static getDaysRemaining(): number | null {
    const subscription = this.getSubscription();
    if (!subscription.expiresAt) return null;

    const now = new Date();
    const expires = new Date(subscription.expiresAt);
    
    // Setze beide Zeiten auf 00:00 für Tagesvergleich
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expiresDate = new Date(expires.getFullYear(), expires.getMonth(), expires.getDate());
    
    const diffTime = expiresDate.getTime() - nowDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  static getTimeRemaining(): { days: number; hours: number; minutes: number } | null {
    const subscription = this.getSubscription();
    if (!subscription.expiresAt) return null;

    const now = new Date();
    const expires = new Date(subscription.expiresAt);
    const diffTime = Math.max(0, expires.getTime() - now.getTime());
    
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
  }

  static extendSubscription(months: number = 1): void {
    const current = this.getSubscription();
    const startDate = current.expiresAt && current.isActive ? new Date(current.expiresAt) : new Date();
    
    startDate.setMonth(startDate.getMonth() + months);
    
    const subscription: PremiumSubscription = {
      isActive: true,
      plan: 'premium',
      expiresAt: startDate,
      features: PREMIUM_FEATURES,
      autoRenew: current.autoRenew,
      paymentMethod: current.paymentMethod
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(subscription));
  }
}