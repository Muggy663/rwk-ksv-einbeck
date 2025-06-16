// src/app/login/page.tsx
"use client"; // Required for redirect and useAuth hook
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Determine where to redirect based on user's role (email for now)
      if (user.email === "admin@rwk-einbeck.de") {
        router.push('/admin');
      } else {
        router.push('/verein/dashboard'); 
      }
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

  if (!loading && user) {
    // User is logged in and will be redirected, show minimal content or loading
    return (
       <div className="flex flex-col justify-center items-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p>Sie sind bereits angemeldet. Weiterleitung...</p>
      </div>
    );
  }
  
  return <LoginForm />;
}