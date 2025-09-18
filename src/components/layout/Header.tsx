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
      <div className="flex h-16 items-center justify-between px-6">
        <div className="text-lg font-semibold text-muted-foreground hidden lg:block">
          RWK KSV Einbeck
        </div>
        
        <div className="flex-1 max-w-md lg:mx-6">
          <GlobalSearch />
        </div>
        
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
          {/* Mobile Burger Menu */}
          <div className="lg:hidden">
            <MobileBurgerMenu />
          </div>
          
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.displayName || user.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
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
