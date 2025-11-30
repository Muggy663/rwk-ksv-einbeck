// src/components/layout/SiteHeader.tsx
"use client";
import { Header } from './Header';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

export function SiteHeader() {
  return <Header />;
}
