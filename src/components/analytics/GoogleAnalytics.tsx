// src/components/analytics/GoogleAnalytics.tsx
"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initGA, trackPageView } from '@/lib/analytics/google-analytics';

export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return null;
}