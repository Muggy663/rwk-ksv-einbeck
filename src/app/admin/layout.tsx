// src/app/admin/layout.tsx
"use client";
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, LayoutDashboard, Users, Trophy, ListChecks, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Hardcoded admin email for now
const ADMIN_EMAIL = "admin@rwk-einbeck.de"; // Replace with your actual admin email or logic

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/seasons', label: 'Saisons', icon: Trophy },
  { href: '/admin/leagues', label: 'Ligen', icon: ListChecks },
  { href: '/admin/clubs', label: 'Vereine', icon: Users },
  { href: '/admin/teams', label: 'Mannschaften', icon: Users },
  { href: '/admin/shooters', label: 'Schützen', icon: Users },
  { href: '/admin/results', label: 'Ergebniserfassung', icon: ListChecks },
];


export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <aside className="w-64 bg-muted/40 p-4 border-r">
          <Skeleton className="h-8 w-3/4 mb-6" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        </aside>
        <main className="flex-1 p-8">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    // router.replace('/login'); // Redirect to login if not admin
    // For now, show an unauthorized message as redirect can cause issues in some SSR contexts initially
     return (
      <div className="container mx-auto px-4 py-12 text-center">
        <ShieldCheck className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-2">Zugriff verweigert</h1>
        <p className="text-muted-foreground mb-6">Sie haben keine Berechtigung, auf diesen Bereich zuzugreifen.</p>
        <Button onClick={() => router.push('/')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Zur Startseite
        </Button>
         <Button onClick={() => router.push('/login')} className="ml-4">
          Zum Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))]"> {/* Adjust min-height considering header */}
      <aside className="w-60 bg-background border-r p-4 shadow-md hidden md:block">
        <div className="flex items-center space-x-2 mb-6">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h2 className="text-xl font-semibold text-primary">Admin Panel</h2>
        </div>
        <nav className="space-y-1">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <Separator className="my-6" />
         <Button variant="outline" onClick={() => router.push('/')} className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" /> App Ansicht
        </Button>
      </aside>
      <main className="flex-1 p-6 lg:p-8 bg-muted/20 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
