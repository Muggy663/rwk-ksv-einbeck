// src/hooks/use-auth.ts
"use client";
import { useAuthContext, type AuthContextType } from '@/components/auth/AuthContext';

export const useAuth = (): AuthContextType => {
  return useAuthContext();
};
