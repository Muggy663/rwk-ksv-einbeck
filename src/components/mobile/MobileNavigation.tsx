// src/components/mobile/MobileNavigation.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Trophy, BarChart3, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { MobileBurgerMenu } from './MobileBurgerMenu';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiresAuth?: boolean;
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
  },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredItems = navItems.filter(item => {
    if (item.requiresAuth && !user) return false;
    if (item.href === '/login' && user) return false;
    return true;
  });

  const itemsToShow = filteredItems.length + 1; // +1 für Burger-Menü
  const gridCols = 'grid-cols-5'; // Immer 5 Spalten: 4 Hauptmenüs + Burger

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
              "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors",
              "text-xs font-medium",
              isActive 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className={cn(
              "h-5 w-5 mb-1",
              isActive ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="truncate w-full text-center text-xs">{item.label}</span>
          </Link>
        );
      })}
      
      {/* Burger Menu */}
      <div className="flex flex-col items-center justify-center py-2 px-1">
        <MobileBurgerMenu />
        <span className="text-xs font-medium text-muted-foreground mt-1">Menü</span>
      </div>
    </div>
  );
}