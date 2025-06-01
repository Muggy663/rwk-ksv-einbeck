"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, Trophy, ListChecks, Edit3, Settings, UserCog, 
  MessagesSquare, FileUp, ArrowLeft, LogOut, History, FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const adminNavItems = [
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
  const { user, loading } = useAuth();

  // Wenn der Benutzer nicht angemeldet ist, zur Login-Seite umleiten
  if (!loading && !user) {
    router.push('/login');
    return null;
  }

  // Prüfen, ob der Benutzer ein Admin ist (vereinfachte Prüfung)
  const isAdmin = user?.email === 'admin@rwk-einbeck.de';

  // Wenn der Benutzer kein Admin ist, zur Startseite umleiten
  if (!loading && !isAdmin) {
    router.push('/');
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
        {user && <Button variant="outline" onClick={async () => { await useAuth().signOut(); router.push('/'); }} className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10">
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>}
      </aside>
      <main className="flex-1 p-6 lg:p-8 bg-muted/20 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}