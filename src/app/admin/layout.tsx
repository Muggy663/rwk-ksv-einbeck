"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { MobileAdminNav } from '@/components/admin/MobileAdminNav';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, Trophy, ListChecks, Edit3, Settings, UserCog, 
  MessagesSquare, FileUp, ArrowLeft, LogOut, History, FileText, Database, RefreshCw, Target
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/seasons', label: 'Saisons & Ligen', icon: Trophy },
  { href: '/admin/clubs', label: 'Vereine', icon: Users },
  { href: '/admin/teams', label: 'Mannschaften', icon: Users },
  { href: '/admin/shooters', label: 'Schützen', icon: Users },
  { href: '/admin/results', label: 'Ergebnisse erfassen', icon: ListChecks },
  { href: '/admin/edit-results', label: 'Ergebnisse bearbeiten', icon: Edit3 },
  { href: '/admin/user-management', label: 'Benutzerverwaltung', icon: UserCog },
  { href: '/admin/team-managers', label: 'Mannschaftsführer', icon: UserCog },
  { href: '/admin/documents', label: 'Dokumente', icon: FileText },
  { href: '/admin/migrate', label: 'Daten-Migration', icon: FileUp },
  { href: '/admin/storage', label: 'Speichernutzung', icon: Database },
  { href: '/admin/recovery', label: 'Datenwiederherstellung', icon: RefreshCw },
  { href: '/admin/emergency-data-entry', label: 'Notfall-Eingabe', icon: Target },
  { href: '/admin/support-tickets', label: 'Support-Tickets', icon: MessagesSquare },
  { href: '/admin/audit', label: 'Änderungsprotokoll', icon: History },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  const isAdmin = user?.email === 'admin@rwk-einbeck.de';

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/');
      }
    }
  }, [loading, user, isAdmin, router]);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.push('/');
  }, [signOut, router]);

  if (loading || (!user) || (!isAdmin && !loading)) {
    return null;
  }

  return (
    <div className="p-6 lg:p-8 bg-muted/20">
      <div className="lg:hidden mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Admin-Bereich</h2>
        <MobileAdminNav />
      </div>
      {children}
    </div>
  );
}
