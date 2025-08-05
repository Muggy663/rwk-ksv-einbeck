"use client";

import React, { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Trophy, Users, ListChecks, ArrowLeft, LogOut, Target, Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useKMAuth } from '@/hooks/useKMAuth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const kmOrgaNavItems = [
  { href: '/km-orga', label: 'KM-Dashboard', icon: Trophy },
  { href: '/km-orga/meldungen', label: 'Meldungen verwalten', icon: ListChecks },
  { href: '/km-orga/mitglieder', label: 'Mitglieder verwalten', icon: Users },
  { href: '/km-orga/mannschaften', label: 'Mannschaften verwalten', icon: Target },
];

export default function KMOrgaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const { hasKMAccess, userRole, loading: kmLoading } = useKMAuth();

  const isAdmin = user?.email === 'admin@rwk-einbeck.de';
  const hasAccess = isAdmin || (userRole === 'km_organisator' && hasKMAccess);

  useEffect(() => {
    if (!loading && !kmLoading) {
      if (!user) {
        router.push('/login');
      } else if (!hasAccess) {
        router.push('/');
      }
    }
  }, [loading, kmLoading, user, hasAccess, router]);

  const handleLogout = useCallback(async () => {
    await signOut();
    router.push('/');
  }, [signOut, router]);

  if (loading || kmLoading || (!user) || (!hasAccess && !loading && !kmLoading)) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-background border-r p-4 shadow-md hidden md:block">
        <div className="flex items-center space-x-2 mb-6">
          <Trophy className="h-7 w-7 text-blue-600" />
          <h2 className="text-xl font-semibold text-blue-600">KM-Organisation</h2>
        </div>
        <nav className="space-y-1">
          {kmOrgaNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/km-orga' && pathname.startsWith(item.href));
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
        {isAdmin && (
          <Button variant="outline" onClick={() => router.push('/admin')} className="w-full mb-2">
            <Settings className="mr-2 h-4 w-4" /> RWK Admin
          </Button>
        )}
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
          <h2 className="text-xl font-semibold text-blue-600">KM-Organisation</h2>
        </div>
        {children}
      </main>
    </div>
  );
}