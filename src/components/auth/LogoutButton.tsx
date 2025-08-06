"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  redirectTo?: string;
}

export function LogoutButton({ 
  className = "w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10", 
  variant = "outline",
  redirectTo = "/"
}: LogoutButtonProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    try {
      await signOut();
      router.push(redirectTo);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  return (
    <Button variant={variant} onClick={handleLogout} className={className}>
      <LogOut className="mr-2 h-4 w-4" /> Logout
    </Button>
  );
}
