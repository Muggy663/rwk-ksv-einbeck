// src/hooks/use-auth.tsx
"use client";
import { useAuthContext, type AuthContextType } from '@/components/auth/AuthContext';
export { AuthProvider } from '@/components/auth/AuthProvider';

export const useAuth = (): AuthContextType => {
  return useAuthContext();
};