// src/components/mobile/MobileNavigation.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Trophy, BarChart3, FileText, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useAccess } from '@/components/schiessnachweis/PremiumProvider';
import { MobileBurgerMenu } from './MobileBurgerMenu';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiresAuth?: boolean;
  requiresRWK?: boolean;
  requiresKM?: boolean;
  requiresSchiessnachweis?: boolean;
}

const navItems: NavItem[] = [
  {
    href: '/',
    icon: Home,
    label: 'Start',
  },
  {
    href: '/rwk-tabellen',
    icon: Trophy,
    label: 'Tabellen',
    requiresRWK: true,
  },
  {
    href: '/schiessnachweis',
    icon: Target,
    label: 'Schießnachweis',
    requiresAuth: true,
    requiresSchiessnachweis: true,
  },
  {
    href: '/statistiken',
    icon: BarChart3,
    label: 'Stats',
  },
  {
    href: '/dashboard-auswahl',
    icon: Users,
    label: 'Verein',
    requiresAuth: true,
    requiresRWK: true,
  },
  {
    href: '/km',
    icon: FileText,
    label: 'KM',
    requiresAuth: true,
    requiresKM: true,
  },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { canAccessRWK, canAccessKM, canAccessSchiessnachweis, userType } = useAccess();

  const filteredItems = navItems.filter(item => {
    if (item.requiresAuth && !user) return false;
    if (item.requiresRWK && !canAccessRWK) return false;
    if (item.requiresKM && !canAccessKM) return false;
    if (item.requiresSchiessnachweis && !canAccessSchiessnachweis) return false;
    if (item.href === '/login' && user) return false;
    return true;
  });

  const gridCols = `grid-cols-${filteredItems.length}`;

  return (
    <div className={`grid ${gridCols} gap-1 w-full max-w-lg mx-auto`}>
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-colors min-h-[60px]",
              "text-xs font-medium touch-manipulation",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className={cn(
              "h-6 w-6 mb-1",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="truncate w-full text-center text-xs leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
