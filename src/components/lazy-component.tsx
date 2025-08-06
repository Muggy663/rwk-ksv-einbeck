"use client";

import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyComponentProps {
  children: React.ReactNode;
  height?: string | number;
  width?: string | number;
}

export function LazyComponent({ children, height = '200px', width = '100%' }: LazyComponentProps) {
  return (
    <Suspense fallback={<Skeleton style={{ height, width }} />}>
      {children}
    </Suspense>
  );
}
