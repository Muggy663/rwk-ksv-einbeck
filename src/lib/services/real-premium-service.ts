// src/lib/services/real-premium-service.ts
"use client";

import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';

export interface RealPremiumSubscription {
  isActive: boolean;
  plan: 'free' | 'monthly' | 'yearly';
  expiresAt?: Date;
  subscriptionId?: string;
}

export class RealPremiumService {
  private static currentUser: User | null = null;
  private static subscription: RealPremiumSubscription | null = null;

  static init() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.loadSubscription();
      } else {
        this.subscription = null;
      }
    });
  }

  static async loadSubscription(): Promise<RealPremiumSubscription> {
    if (!this.currentUser) {
      return { isActive: false, plan: 'free' };
    }

    try {
      const idToken = await this.currentUser.getIdToken();
      const response = await fetch('/api/sync', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.subscription = {
          isActive: data.isPremium,
          plan: data.isPremium ? 'monthly' : 'free'
        };
        return this.subscription;
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }

    return { isActive: false, plan: 'free' };
  }

  static async subscribe(plan: 'monthly' | 'yearly'): Promise<boolean> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const idToken = await this.currentUser.getIdToken();
      const response = await fetch('/api/premium/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken, plan })
      });

      if (response.ok) {
        const data = await response.json();
        this.subscription = {
          isActive: true,
          plan,
          expiresAt: new Date(data.expiresAt),
          subscriptionId: data.subscriptionId
        };
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Subscription failed:', error);
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          idToken, 
          data, 
          action: 'upload' 
        })
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          idToken, 
          action: 'download' 
        })
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

  static getSubscription(): RealPremiumSubscription {
    return this.subscription || { isActive: false, plan: 'free' };
  }

  static isAuthenticated(): boolean {
    return !!this.currentUser;
  }
}