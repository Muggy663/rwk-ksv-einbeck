// src/components/layout/MainNav.tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Table, Newspaper, HardHat, LogIn, LogOut, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  authRequired?: boolean;
  hideWhenAuthed?: boolean;
}

export function MainNav() {
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();

  const navItems: NavItem[] = [
    { href: '/', label: 'Startseite', icon: Home },
    { href: '/rwk-tabellen', label: 'RWK Tabellen', icon: Table },
    { href: '/updates', label: 'Updates', icon: Newspaper },
    { href: '/km', label: 'KM', icon: HardHat },
    { href: '/login', label: 'Login', icon: LogIn, hideWhenAuthed: true },
  ];

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => {
        if (item.hideWhenAuthed && user) return null;
        if (item.authRequired && !user) return null;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 p-2 rounded-md",
              pathname === item.href ? 'text-primary bg-accent/20' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
      {user && (
        <div className="flex items-center gap-2">
           <span className="text-sm text-muted-foreground hidden md:inline">{user.email}</span>
           <UserCircle className="h-6 w-6 text-muted-foreground md:hidden" />
          <Button variant="ghost" size="sm" onClick={signOut} disabled={loading} className="flex items-center gap-2 p-2 rounded-md text-muted-foreground hover:text-primary">
            <LogOut className="h-5 w-5" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      )}
    </nav>
  );
}
