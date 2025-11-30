"use client";

import { useAuth } from '@/hooks/use-auth';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
}

export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const { user } = useAuth();
  
  // Hook immer aufrufen, aber nur aktivieren wenn User eingeloggt ist
  useSessionTimeout(!!user);
  
  return <>{children}</>;
}
