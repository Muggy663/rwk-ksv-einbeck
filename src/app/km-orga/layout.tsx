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
    <div className="p-6 lg:p-8 bg-muted/20">
      <div className="lg:hidden mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-blue-600">KM-Organisation</h2>
      </div>
      {children}
    </div>
  );
}
