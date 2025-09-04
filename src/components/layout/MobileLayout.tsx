// src/components/layout/MobileLayout.tsx
"use client";

import React, { ReactNode } from 'react';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MobileLayout({ children, className }: MobileLayoutProps) {
  const { isMobile } = useMobileDetection();

  return (
    <div className={cn(
      "min-h-screen",
      isMobile ? "mobile-layout" : "desktop-layout",
      className
    )}>
      {children}
    </div>
  );
}

interface MobileHeaderProps {
  children: ReactNode;
  className?: string;
}

export function MobileHeader({ children, className }: MobileHeaderProps) {
  const { isMobile } = useMobileDetection();

  return (
    <header className={cn(
      isMobile ? "mobile-header" : "desktop-header",
      "bg-background border-b",
      className
    )}>
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {children}
      </div>
    </header>
  );
}

interface MobileContentProps {
  children: ReactNode;
  className?: string;
}

export function MobileContent({ children, className }: MobileContentProps) {
  const { isMobile } = useMobileDetection();

  return (
    <main className={cn(
      isMobile ? "mobile-content" : "desktop-content",
      className
    )}>
      {children}
    </main>
  );
}

interface MobileBottomNavProps {
  children: ReactNode;
  className?: string;
}

export function MobileBottomNav({ children, className }: MobileBottomNavProps) {
  const { isMobile } = useMobileDetection();

  if (!isMobile) return null;

  return (
    <nav className={cn("mobile-bottom-nav", className)}>
      <div className="container mx-auto px-4 h-full flex items-center justify-around">
        {children}
      </div>
    </nav>
  );
}