// src/components/layout/MainNav.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { 
  BarChart3, 
  CalendarDays, 
  FileBarChart, 
  Home, 
  LogOut, 
  Menu, 
  ShieldCheck, 
  User, 
  BookOpen,
  Edit3,
  LogIn,
  FileText,
  MessageSquare,
  Bell,
  Clock,
  Settings,
  TrendingUp,
  AlertTriangle,
  Newspaper
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RouteItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}

export function MainNav() {
  const pathname = usePathname();
  const { user, loading, signOut, resetInactivityTimer } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(10 * 60); // 10 Minuten in Sekunden

  const isAdmin = user && user.email === 'admin@rwk-einbeck.de';
  const isVereinsvertreterOrMannschaftsfuehrer = user && user.email !== 'admin@rwk-einbeck.de';

  // Timer-Logik
  useEffect(() => {
    if (!user || !resetInactivityTimer) return;
    
    // Timer aktualisieren
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    // Timer zurücksetzen bei Benutzeraktivität
    const handleUserActivity = () => {
      resetInactivityTimer();
      setTimeLeft(10 * 60);
    };
    
    // Event-Listener für Benutzeraktivität
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    return () => {
      clearInterval(timer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user, resetInactivityTimer]);
  
  // Zeit formatieren (mm:ss)
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
      href: '/termine',
      label: 'Termine',
      icon: <CalendarDays className="h-4 w-4 mr-2" />,
      active: pathname === '/termine',
    },
    {
      href: '/dokumente',
      label: 'Dokumente',
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
      href: '/support',
      label: 'Support',
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      active: pathname === '/support',
    },
    {
      href: '/updates',
      label: 'Updates',
      icon: <Bell className="h-4 w-4 mr-2" />,
      active: pathname === '/updates',
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

  const vereinsvertreterRoutes: RouteItem[] = [
    {
      href: '/verein/dashboard',
      label: 'RWK',
      icon: <User className="h-4 w-4 mr-2" />,
      active: pathname === '/verein/dashboard' || pathname.startsWith('/verein/'),
    },
  ];

  const mannschaftsfuehrerRoutes: RouteItem[] = [];

  // Vereinfachte Navigation gemäß Anforderungen für Version 0.7.1
  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {/* Desktop Navigation */}
      <div className="hidden md:flex md:items-center md:space-x-4">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center",
              route.active ? "text-primary" : "text-muted-foreground"
            )}
          >
            {route.icon}
            {route.label}
          </Link>
        ))}

        {isAdmin && adminRoutes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center",
              route.active ? "text-primary" : "text-muted-foreground"
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
                "text-sm font-medium transition-colors hover:text-primary flex items-center",
                pathname === '/protests' ? "text-primary" : "text-muted-foreground"
              )}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Proteste
            </Link>
            <Link
              href="/news"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center",
                pathname === '/news' ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Newspaper className="h-4 w-4 mr-2" />
              News
            </Link>
            <Link
              href="/notifications"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary flex items-center",
                pathname === '/notifications' ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Bell className="h-4 w-4 mr-2" />
              Benachrichtigungen
            </Link>
          </>
        )}

        {isVereinsvertreterOrMannschaftsfuehrer && (
          <>
            {vereinsvertreterRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center",
                  route.active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {route.icon}
                {route.label}
              </Link>
            ))}
            
            {mannschaftsfuehrerRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center",
                  route.active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {route.icon}
                {route.label}
              </Link>
            ))}
          </>
        )}

        {user && (
          <Link
            href="/dashboard-auswahl"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center",
              pathname === '/dashboard-auswahl' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Settings className="h-4 w-4 mr-2" />
            KM
          </Link>
        )}

        {/* Timer und Logout */}
        <div className="flex items-center space-x-2 ml-4">
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

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Navigation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {routes.map((route) => (
              <DropdownMenuItem key={route.href} asChild>
                <Link
                  href={route.href}
                  className={cn(
                    "flex items-center",
                    route.active ? "text-primary" : "text-muted-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {route.icon}
                  {route.label}
                </Link>
              </DropdownMenuItem>
            ))}
            
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                {adminRoutes.map((route) => (
                  <DropdownMenuItem key={route.href} asChild>
                    <Link
                      href={route.href}
                      className={cn(
                        "flex items-center",
                        route.active ? "text-primary" : "text-muted-foreground"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {route.icon}
                      {route.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            
            {isVereinsvertreterOrMannschaftsfuehrer && (
              <>
                <DropdownMenuSeparator />
                {vereinsvertreterRoutes.map((route) => (
                  <DropdownMenuItem key={route.href} asChild>
                    <Link
                      href={route.href}
                      className={cn(
                        "flex items-center",
                        route.active ? "text-primary" : "text-muted-foreground"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {route.icon}
                      {route.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                
                {mannschaftsfuehrerRoutes.map((route) => (
                  <DropdownMenuItem key={route.href} asChild>
                    <Link
                      href={route.href}
                      className={cn(
                        "flex items-center",
                        route.active ? "text-primary" : "text-muted-foreground"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {route.icon}
                      {route.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuItem asChild>
                  <Link
                    href="/verein/ergebnisse"
                    className="flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Ergebnisse erfassen
                  </Link>
                </DropdownMenuItem>
                
                {/* Vereinfachte Terminverwaltung - nur ein Menüpunkt */}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/termine"
                    className="flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Terminkalender
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link
                    href="/protests"
                    className="flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Proteste
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link
                    href="/news"
                    className="flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Newspaper className="h-4 w-4 mr-2" />
                    News
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link
                    href="/notifications"
                    className="flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Benachrichtigungen
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link
                    href="/einstellungen"
                    className="flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Einstellungen
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            
            {user ? (
              <>
                <DropdownMenuSeparator />
                {user && resetInactivityTimer && (
                  <DropdownMenuItem onClick={() => {
                    resetInactivityTimer();
                    setTimeLeft(10 * 60);
                  }}>
                    <Clock className="h-4 w-4 mr-2" />
                    {formattedTime}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { signOut(); setIsMobileMenuOpen(false); }}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/login"
                    className="flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}