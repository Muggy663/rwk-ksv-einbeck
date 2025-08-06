"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordChangeForm } from '@/components/auth/PasswordChangeForm';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function ChangePasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Benutzer ist nicht angemeldet, zur Login-Seite weiterleiten
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-full max-w-md space-y-6">
          <Skeleton className="h-10 w-1/2 mx-auto" />
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!loading && !user) {
    // Benutzer ist nicht angemeldet und wird weitergeleitet
    return (
      <div className="flex flex-col justify-center items-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p>Sie müssen angemeldet sein, um Ihr Passwort zu ändern. Weiterleitung...</p>
      </div>
    );
  }
  
  return <PasswordChangeForm />;
}
