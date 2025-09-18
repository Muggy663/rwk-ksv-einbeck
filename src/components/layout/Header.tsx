// src/components/layout/Header.tsx
"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, Clock } from 'lucide-react';
import { MobileBurgerMenu } from '@/components/mobile/MobileBurgerMenu';
import { useEffect, useState } from 'react';

export function Header() {
  const { user, signOut } = useAuth();
  const [timeLeft, setTimeLeft] = useState<string>('');
  
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
  
  // Logout Timer
  useEffect(() => {
    if (!user) return;
    
    const updateTimer = () => {
      const loginTime = localStorage.getItem('loginTime');
      if (!loginTime) {
        localStorage.setItem('loginTime', Date.now().toString());
        return;
      }
      
      const elapsed = Date.now() - parseInt(loginTime);
      const sessionDuration = 8 * 60 * 60 * 1000; // 8 Stunden
      const remaining = sessionDuration - elapsed;
      
      if (remaining <= 0) {
        signOut();
        return;
      }
      
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [user, signOut]);
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-2 sm:px-4 lg:px-6 max-w-7xl overflow-hidden">
        <Link href="/" className="text-lg font-semibold text-primary hover:text-primary/80 hidden lg:block flex-shrink-0 transition-colors">
          RWK KSV Einbeck
        </Link>
        
        <div className="flex-1 max-w-md lg:mx-6 mx-2 min-w-0">
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
              {timeLeft && (
                <div className="hidden md:flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {timeLeft}
                </div>
              )}
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
