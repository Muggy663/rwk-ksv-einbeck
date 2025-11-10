"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { CompletePremiumService, CompletePremiumSubscription } from '@/lib/services/complete-premium-service';
import { UserPermissions, canAccessPremiumFeatures, determineUserType } from '@/lib/auth/roles';
import { auth } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface PremiumContextType {
  subscription: CompletePremiumSubscription;
  isPremium: boolean;
  hasFeature: (feature: keyof CompletePremiumSubscription['features']) => boolean;
  subscribe: (plan: 'monthly' | 'yearly') => Promise<string | null>;
  cancel: () => Promise<boolean>;
  loading: boolean;
  userPermissions: UserPermissions | null;
  canAccessFeature: (feature: string) => boolean;
}

const PremiumContext = createContext<PremiumContextType | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<CompletePremiumSubscription>(
    CompletePremiumService.getSubscription()
  );
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);

  useEffect(() => {
    CompletePremiumService.init();
    
    const unsubscribe = CompletePremiumService.onSubscriptionChange((newSubscription) => {
      setSubscription(newSubscription);
      setLoading(false);
    });

    // Auth state listener
    const authUnsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Prüfe user_permissions Collection
          const userPermDoc = await getDoc(doc(db, 'user_permissions', user.uid));
          if (userPermDoc.exists()) {
            const permissions = userPermDoc.data() as UserPermissions;
            permissions.userType = determineUserType(permissions);
            setUserPermissions(permissions);
          } else {
            // Neuer User - als INDIVIDUAL einrichten und in Firestore speichern
            const newPermissions: UserPermissions = {
              uid: user.uid,
              email: user.email || undefined,
              userType: 'INDIVIDUAL',
              isPremium: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            // Speichere in Firestore
            try {
              await setDoc(doc(db, 'user_permissions', user.uid), {
                ...newPermissions,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              console.log('New user permissions created for:', user.email);
            } catch (error) {
              console.error('Failed to create user permissions:', error);
            }
            
            setUserPermissions(newPermissions);
          }
        } catch (error) {
          console.error('Error loading user permissions:', error);
        }
      } else {
        setUserPermissions(null);
      }
    });

    // Initial load
    CompletePremiumService.loadSubscription().then(() => {
      setLoading(false);
    });

    return () => {
      unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const contextValue: PremiumContextType = {
    subscription,
    isPremium: userPermissions ? canAccessPremiumFeatures(userPermissions) : false,
    hasFeature: (feature) => {
      if (!userPermissions) return false;
      return canAccessPremiumFeatures(userPermissions) && subscription.features[feature];
    },
    subscribe: CompletePremiumService.subscribe,
    cancel: CompletePremiumService.cancel,
    loading,
    userPermissions,
    canAccessFeature: (feature: string) => {
      if (!userPermissions) return false;
      
      // Basis-Features für alle registrierten Nutzer
      const basicFeatures = ['schiessnachweis', 'basic_statistics'];
      if (basicFeatures.includes(feature)) {
        return userPermissions.userType !== 'GUEST';
      }
      
      // Premium-Features nur für Premium-Nutzer
      return canAccessPremiumFeatures(userPermissions);
    }
  };

  return (
    <PremiumContext.Provider value={contextValue}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within PremiumProvider');
  }
  return context;
}

// Helper Hook für Zugriffskontrolle
export function useAccess() {
  const { userPermissions } = usePremium();
  
  return {
    canAccessRWK: userPermissions ? 
      (userPermissions.platformRole === 'SUPER_ADMIN' ||
       (userPermissions.kvRoles && Object.keys(userPermissions.kvRoles).length > 0) ||
       (userPermissions.clubRoles && Object.keys(userPermissions.clubRoles).length > 0) ||
       userPermissions.role === 'vereinsvertreter') : false,
    
    canAccessKM: userPermissions ? 
      (userPermissions.platformRole === 'SUPER_ADMIN' ||
       (userPermissions.kvRoles && Object.keys(userPermissions.kvRoles).length > 0) ||
       (userPermissions.clubRoles && Object.keys(userPermissions.clubRoles).length > 0) ||
       userPermissions.role === 'vereinsvertreter') : false,
    
    canAccessSchiessnachweis: userPermissions ? 
      userPermissions.userType !== 'GUEST' : false,
    
    userType: userPermissions?.userType || 'GUEST'
  };
}