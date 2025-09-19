// src/components/layout/Header.tsx
"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn } from 'lucide-react';
import { MobileBurgerMenu } from '@/components/mobile/MobileBurgerMenu';
import { InactivityTimer } from '@/components/auth/InactivityTimer';
import { useEffect } from 'react';

export function Header() {
  const { user, signOut } = useAuth();
  
  useEffect(() => {
    const handleRouteChange = () => {
      // Ensure header stays visible during navigation
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'block';
        header.style.visibility = 'visible';
        header.style.opacity = '1';
      }
    };
    
    // Run immediately and on any DOM changes
    handleRouteChange();
    
    // Listen for navigation events
    const observer = new MutationObserver(handleRouteChange);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-2 sm:px-4 lg:px-6 max-w-7xl overflow-hidden">
        <div className="flex-1 max-w-md lg:max-w-lg mx-2 min-w-0">
          <GlobalSearch />
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <ThemeToggle />
          
          {/* Mobile Burger Menu */}
          <div className="lg:hidden">
            <MobileBurgerMenu />
          </div>
          
          {user ? (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="hidden md:block">
                <InactivityTimer />
              </div>
              <span className="text-sm text-muted-foreground hidden md:block truncate max-w-32">
                {user.displayName || user.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
