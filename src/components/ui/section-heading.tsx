"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  scrollMargin?: boolean;
}

export function SectionHeading({ id, children, className, scrollMargin = true }: SectionHeadingProps) {
  return (
    <h2 
      id={id}
      className={cn(
        "text-2xl font-bold text-primary border-b pb-2",
        scrollMargin && "scroll-mt-20",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function SubSectionHeading({ id, children, className, scrollMargin = true }: SectionHeadingProps) {
  return (
    <h3 
      id={id}
      className={cn(
        "text-xl font-bold text-primary",
        scrollMargin && "scroll-mt-24",
        className
      )}
    >
      {children}
    </h3>
  );
}