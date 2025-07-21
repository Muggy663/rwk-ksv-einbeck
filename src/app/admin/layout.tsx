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
    <div className="flex min-h-screen">
      <aside className="w-64 bg-background border-r p-4 shadow-md hidden md:block">
        <div className="flex items-center space-x-2 mb-6">
          <Settings className="h-7 w-7 text-primary" />
          <h2 className="text-xl font-semibold text-primary">Admin-Bereich</h2>
        </div>
        <nav className="space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors", 
                  isActive
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Separator className="my-6" />
        <Button variant="outline" onClick={() => router.push('/')} className="w-full mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Zur Startseite
        </Button>
        <Button 
          variant="outline" 
          onClick={handleLogout} 
          className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </aside>
      <main className="flex-1 p-6 lg:p-8 bg-muted/20 overflow-y-auto">
        <div className="md:hidden mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-primary">Admin-Bereich</h2>
          <MobileAdminNav />
        </div>
        {children}
      </main>
    </div>
  );
}