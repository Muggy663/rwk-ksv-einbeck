// src/components/AppVersionChecker.tsx
'use client';

import { useEffect } from 'react';
import { checkAndClearOnUpdate } from '@/utils/appVersion';

export function AppVersionChecker() {
  useEffect(() => {
    checkAndClearOnUpdate();
  }, []);

  return null;
}