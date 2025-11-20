// src/lib/services/complete-premium-service.ts
"use client";

import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';

export interface CompletePremiumSubscription {
  isActive: boolean;
  plan: 'free' | 'monthly' | 'yearly';
  expiresAt?: Date;
  subscriptionId?: string;
  features: {
    cloudSync: boolean;
    multiDevice: boolean;
    advancedStats: boolean;
    performanceAnalysis: boolean;
  };
}

export class CompletePremiumService {
  private static currentUser: User | null = null;
  private static subscription: CompletePremiumSubscription | null = null;
  private static listeners: ((subscription: CompletePremiumSubscription) => void)[] = [];

  static init() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.loadSubscription();
      } else {
        this.subscription = this.getFreeSubscription();
        this.notifyListeners();
      }
    });
  }

  static async loadSubscription(): Promise<CompletePremiumSubscription> {
    if (!this.currentUser) {
      const freeSubscription = this.getFreeSubscription();
      this.subscription = freeSubscription;
      this.notifyListeners();
      return freeSubscription;
    }

    try {
      const idToken = await this.currentUser.getIdToken();
      const response = await fetch('/api/sync', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        this.subscription = {
          isActive: data.isPremium,
          plan: data.isPremium ? 'monthly' : 'free',
          features: {
            cloudSync: data.isPremium,
            multiDevice: data.isPremium,
            advancedStats: data.isPremium,
            performanceAnalysis: data.isPremium
          }
        };
      } else {
        this.subscription = this.getFreeSubscription();
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
      this.subscription = this.getFreeSubscription();
    }

    this.notifyListeners();
    return this.subscription;
  }

  static async subscribe(plan: 'monthly' | 'yearly'): Promise<string | null> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const idToken = await this.currentUser.getIdToken();
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, plan })
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
      
      return null;
    } catch (error) {
      console.error('Subscription failed:', error);
      return null;
    }
  }

  static async cancel(): Promise<boolean> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const idToken = await this.currentUser.getIdToken();
      const response = await fetch('/api/premium/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (response.ok) {
        await this.loadSubscription();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Cancellation failed:', error);
      return false;
    }
  }

  static async syncToCloud(data: any): Promise<boolean> {
    if (!this.currentUser || !this.isPremium()) {
      throw new Error('Premium required for cloud sync');
    }

    try {
      const idToken = await this.currentUser.getIdToken();
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, data, action: 'upload' })
      });

      return response.ok;
    } catch (error) {
      console.error('Cloud sync failed:', error);
      return false;
    }
  }

  static async syncFromCloud(): Promise<any> {
    if (!this.currentUser || !this.isPremium()) {
      throw new Error('Premium required for cloud sync');
    }

    try {
      const idToken = await this.currentUser.getIdToken();
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, action: 'download' })
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('Cloud download failed:', error);
      return null;
    }
  }

  static isPremium(): boolean {
    return this.subscription?.isActive || false;
  }

  static hasFeature(feature: keyof CompletePremiumSubscription['features']): boolean {
    return this.subscription?.features[feature] || false;
  }

  static getSubscription(): CompletePremiumSubscription {
    return this.subscription || this.getFreeSubscription();
  }

  static isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  static onSubscriptionChange(callback: (subscription: CompletePremiumSubscription) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private static getFreeSubscription(): CompletePremiumSubscription {
    return {
      isActive: false,
      plan: 'free',
      features: {
        cloudSync: false,
        multiDevice: false,
        advancedStats: false,
        performanceAnalysis: false
      }
    };
  }

  private static notifyListeners() {
    if (this.subscription) {
      this.listeners.forEach(listener => listener(this.subscription!));
    }
  }
}
