// src/app/admin/layout.tsx
"use client";
import type { ReactNode } from 'react';
import { useEffect } from 'react'; 
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Users, Trophy, ListChecks, ArrowLeft, Edit3, Settings, LogOut, UserCircle, Building, BarChart3, FileUp, Award, UserCog, MessagesSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const ADMIN_EMAIL = "admin@rwk-einbeck.de";

interface AdminLayoutProps {
  children: ReactNode;
}

const superAdminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/seasons', label: 'Saisons', icon: Trophy },
  { href: '/admin/leagues', label: 'Ligen', icon: ListChecks },
  { href: '/admin/clubs', label: 'Vereine', icon: Users }, 
  { href: '/admin/teams', label: 'Mannschaften', icon: Users },
  { href: '/admin/shooters', label: 'Schützen', icon: UserCircle },
  { href: '/admin/results', label: 'Ergebniserfassung', icon: ListChecks },
  { href: '/admin/edit-results', label: 'Ergebnisse bearbeiten', icon: Edit3 },
  { href: '/admin/support-tickets', label: 'Support Tickets', icon: MessagesSquare },
  { href: '/admin/user-management', label: 'Benutzerverwaltung', icon: UserCog, isWip: true }, 
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.email !== ADMIN_EMAIL) {
      router.push('/verein/dashboard'); 
    }
  }, [user, loading, router]);


  if (loading || !user) { 
    return (
      <div className="flex min-h-screen">
        <aside className="w-60 bg-muted/40 p-4 border-r">
          <Skeleton className="h-8 w-3/4 mb-6" />
          <div className="space-y-2">
            {superAdminNavItems.map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        </aside>
        <main className="flex-1 p-8">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }
  
  if (user.email !== ADMIN_EMAIL) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p>Weiterleitung...</p>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))]">
      <aside className="w-60 bg-background border-r p-4 shadow-md hidden md:block">
        <div className="flex items-center space-x-2 mb-6">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h2 className="text-xl font-semibold text-primary">Admin Panel</h2>
        </div>
        <nav className="space-y-1">
          {superAdminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                item.isWip && "opacity-70" 
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}{item.isWip ? " (Demnächst)" : ""}</span>
            </Link>
          ))}
        </nav>
        <Separator className="my-6" />
         <Button variant="outline" onClick={() => router.push('/')} className="w-full mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> App Ansicht
        </Button>
        <Button variant="outline" onClick={signOut} className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10">
            <LogOut className="mr-2 h-4 w-4"/> Logout
        </Button>
      </aside>
      <main className="flex-1 p-6 lg:p-8 bg-muted/20 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
