// src/hooks/use-auth.js
"use client";
import { useAuthContext } from '@/components/auth/AuthContext';
export { AuthProvider } from '@/components/auth/AuthProvider';

/**
 * Hook für den Zugriff auf den Auth-Kontext
 * @returns {import('@/components/auth/AuthContext').AuthContextType} Auth-Kontext
 */
export const useAuth = () => {
  return useAuthContext();
};