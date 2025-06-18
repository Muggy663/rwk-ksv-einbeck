"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface TableHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHeading({ children, className }: TableHeadingProps) {
  return (
    <h3 className={cn("text-xl font-bold text-primary", className)}>
      {children}
    </h3>
  );
}