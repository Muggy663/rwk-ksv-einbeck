// src/components/layout/MainNav.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { 
  CalendarDays, 
  FileBarChart, 
  Home, 
  LogOut, 
  ShieldCheck, 
  BookOpen,
  LogIn,
  FileText,
  MessageSquare,
  Bell,
  Clock,
  Settings,
  TrendingUp,
  AlertTriangle,
  Newspaper,
  Target
} from 'lucide-react';

interface RouteItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}

export function MainNav() {
  const pathname = usePathname();
  const { user, signOut, resetInactivityTimer } = useAuth();

  const [timeLeft, setTimeLeft] = useState<number>(10 * 60);

  const isAdmin = user && user.email === 'admin@rwk-einbeck.de';

  useEffect(() => {
    if (!user) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [user]);
  
  useEffect(() => {
    if (!user || !resetInactivityTimer) return;
    
    const handleUserActivity = () => {
      setTimeLeft(10 * 60);
    };
    
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity, true);
    });
    
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [user, resetInactivityTimer]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const routes: RouteItem[] = [
    {
      href: '/',
      label: 'Home',
      icon: <Home className="h-4 w-4 mr-2" />,
      active: pathname === '/',
    },
    {
      href: '/rwk-tabellen',
      label: 'Tabellen',
      icon: <FileBarChart className="h-4 w-4 mr-2" />,
      active: pathname === '/rwk-tabellen',
    },
    {
      href: '/statistiken',
      label: 'Statistiken',
      icon: <TrendingUp className="h-4 w-4 mr-2" />,
      active: pathname === '/statistiken',
    },
    {
      href: '/schiessnachweis',
      label: 'Schießnachweis',
      icon: <Target className="h-4 w-4 mr-2" />,
      active: pathname === '/schiessnachweis',
    },
    {
      href: '/termine',
      label: 'Termine',
      icon: <CalendarDays className="h-4 w-4 mr-2" />,
      active: pathname === '/termine',
    },
    {
      href: '/dokumente',
      label: 'Dateien',
      icon: <FileText className="h-4 w-4 mr-2" />,
      active: pathname === '/dokumente',
    },
    {
      href: '/handbuch',
      label: 'Handbuch',
      icon: <BookOpen className="h-4 w-4 mr-2" />,
      active: pathname === '/handbuch',
    },
    {
      href: '/kreisverband',
      label: 'Kreisverbände',
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      active: pathname === '/kreisverband',
    },
    {
      href: '/support',
      label: 'Support',
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      active: pathname === '/support',
    },
  ];

  const adminRoutes: RouteItem[] = [
    {
      href: '/admin',
      label: 'Admin',
      icon: <ShieldCheck className="h-4 w-4 mr-2" />,
      active: pathname === '/admin' || pathname.startsWith('/admin/'),
    },
  ];

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {/* Desktop Navigation */}
      <div className="hidden lg:flex lg:items-center lg:gap-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all",
              route.active
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {route.icon}
            {route.label}
          </Link>
        ))}
        
        {/* Admin-only Links */}
        {isAdmin && adminRoutes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all",
              route.active
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {route.icon}
            {route.label}
          </Link>
        ))}
        
        {isAdmin && (
          <>
            <Link
              href="/protests"
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all",
                pathname === '/protests' ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Proteste
            </Link>
            <Link
              href="/news"
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all",
                pathname === '/news' ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Newspaper className="h-4 w-4 mr-2" />
              News
            </Link>
            <Link
              href="/notifications"
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all",
                pathname === '/notifications' ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Bell className="h-4 w-4 mr-2" />
              Benachrichtigungen
            </Link>
          </>
        )}

        {user && (
          <Link
            href="/dashboard-auswahl"
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all",
              pathname === '/dashboard-auswahl' || pathname.startsWith('/admin') || pathname.startsWith('/verein') || pathname.startsWith('/km') ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4 mr-2" />
            Arbeitsbereich
          </Link>
        )}

        <div className="ml-3 flex items-center gap-1 border-l pl-3">
          {user && resetInactivityTimer && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                resetInactivityTimer();
                setTimeLeft(10 * 60);
              }}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
            >
              <Clock className="h-4 w-4 mr-2" />
              {formattedTime}
            </Button>
          )}
          
          {user ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Link>
          )}
        </div>
      </div>


    </nav>
  );
}
