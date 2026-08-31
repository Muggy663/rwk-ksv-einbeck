// src/hooks/use-auth.ts
"use client";
import { useAuthContext, AuthContextType } from '@/components/auth/AuthContext';
export { AuthProvider } from '@/components/auth/AuthProvider';

/**
 * Hook für den Zugriff auf den Auth-Kontext
 * @returns Auth-Kontext
 */
export const useAuth = (): AuthContextType => {
  return useAuthContext();
};
