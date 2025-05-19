// src/components/layout/MainNav.tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Table, Newspaper, HardHat, LogIn, LogOut, UserCircle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

// Hardcoded admin email for now
const ADMIN_EMAIL = "admin@rwk-einbeck.de"; // Replace with your actual admin email or logic

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  authRequired?: boolean;
  hideWhenAuthed?: boolean;
  adminOnly?: boolean;
}

export function MainNav() {
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();

  const isAdmin = user && user.email === ADMIN_EMAIL;

  const navItems: NavItem[] = [
    { href: '/', label: 'Startseite', icon: Home },
    { href: '/rwk-tabellen', label: 'RWK Tabellen', icon: Table },
    { href: '/updates', label: 'Updates', icon: Newspaper },
    { href: '/km', label: 'KM', icon: HardHat },
    { href: '/admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
    { href: '/login', label: 'Login', icon: LogIn, hideWhenAuthed: true },
  ];

  return (
    <nav className="flex items-center space-x-2 lg:space-x-4">
      {navItems.map((item) => {
        if (item.hideWhenAuthed && user && !item.adminOnly) return null; // Hide login if user is logged in, unless it's an admin only link meant for logged in admins
        if (item.authRequired && !user) return null;
        if (item.adminOnly && !isAdmin) return null; // Only show admin links to admins

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 p-2 rounded-md",
              pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href ? 'text-primary bg-accent/20' : 'text-muted-foreground',
              "max-md:p-1.5" // Smaller padding on smaller screens
            )}
            title={item.label} // Tooltip for icon-only view
          >
            <item.icon className="h-5 w-5" />
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
      {user && (
        <div className="flex items-center gap-2">
           <span className="text-sm text-muted-foreground hidden md:inline max-w-[100px] truncate" title={user.email || undefined}>{user.email}</span>
           <UserCircle className="h-6 w-6 text-muted-foreground md:hidden" title={user.email || undefined} />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut} 
            disabled={loading} 
            className="flex items-center gap-1.5 p-2 rounded-md text-muted-foreground hover:text-primary max-md:p-1.5"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      )}
    </nav>
  );
}
