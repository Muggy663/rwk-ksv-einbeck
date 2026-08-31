"use client";

import React, { useEffect } from 'react';
import { DarkModeDemo } from '@/components/dark-mode-demo';
import { SocialSettingsPage } from '@/components/social/ProfileSettings';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/einstellungen');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="container py-8 max-w-5xl mx-auto text-center">Laden...</div>;
  }

  if (!user) {
    return null;
  }
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/social">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Social Training
        </Link>
      </Button>
      
      <h1 className="text-3xl font-bold mb-6 text-primary">Einstellungen</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <SocialSettingsPage />
        <DarkModeDemo />
      </div>
    </div>
  );
}
