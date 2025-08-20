// src/components/AppVersionChecker.tsx
'use client';

import { useEffect, useState } from 'react';
import { checkAndClearOnUpdate } from '@/utils/appVersion';

export function AppVersionChecker() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    if (mounted) {
      checkAndClearOnUpdate();
    }
  }, [mounted]);

  return null;
}