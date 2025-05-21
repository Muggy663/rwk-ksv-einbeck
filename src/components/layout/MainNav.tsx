// src/components/layout/MainNav.tsx
"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Table, Newspaper, HardHat, LogIn, LogOut, UserCircle, ShieldCheck, Building, HelpCircle, BookOpenCheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

const ADMIN_EMAIL = "admin@rwk-einbeck.de";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  authRequired?: boolean;
  hideWhenAuthed?: boolean;
  adminOnly?: boolean;
  vereinOnly?: boolean;
}

export function MainNav() {
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth(); // Ensure 'loading' is destructured
  const router = useRouter();

  const isSuperAdmin = user && user.email === ADMIN_EMAIL;
  const isVereinsVertreter = user && user.email !== ADMIN_EMAIL;

  const navItems: NavItem[] = [
    { href: '/', label: 'Startseite', icon: Home },
    { href: '/rwk-tabellen', label: 'RWK Tabellen', icon: Table },
    { href: '/updates', label: 'Updates', icon: Newspaper },
    { href: '/km', label: 'KM', icon: HardHat },
    { href: '/handbuch', label: 'Handbuch', icon: BookOpenCheckIcon },
    { href: '/support', label: 'Support', icon: HelpCircle },
    { href: '/admin', label: 'Admin Panel', icon: ShieldCheck, adminOnly: true },
    { href: '/verein/dashboard', label: 'Mein Verein', icon: Building, vereinOnly: true },
    { href: '/login', label: 'Login', icon: LogIn, hideWhenAuthed: true },
  ];

  return (
    <nav className="flex items-center space-x-1 lg:space-x-2">
      {navItems.map((item) => {
        // Use 'loading' consistently
        if (loading && (item.adminOnly || item.vereinOnly || item.authRequired)) return null;
        if (user && item.hideWhenAuthed) return null;
        if (!user && item.authRequired && !loading) return null; 
        if (item.adminOnly && !isSuperAdmin) return null;
        if (item.vereinOnly && !isVereinsVertreter) return null;
        
        // Prevent VVs from seeing Admin Panel and Admins from seeing "Mein Verein" directly
        if (item.vereinOnly && isSuperAdmin) return null;
        if (item.adminOnly && isVereinsVertreter) return null;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 p-2 rounded-md",
              (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) ? 'text-primary bg-accent/20' : 'text-muted-foreground',
              "max-md:p-1.5"
            )}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
      {user && (
        <div className="flex items-center gap-2">
           {user.email && <span className="text-sm text-muted-foreground hidden md:inline max-w-[100px] truncate" title={user.email}>{user.email}</span>}
           {user.email && <UserCircle className="h-6 w-6 text-muted-foreground md:hidden" title={user.email} />}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            disabled={loading} // Use 'loading'
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
