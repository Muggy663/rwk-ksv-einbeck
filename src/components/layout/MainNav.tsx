// src/components/layout/MainNav.tsx
"use client";
import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Table as TableIcon, 
  Newspaper, 
  LogIn,
  LogOut, 
  UserCircle, 
  ShieldCheck, 
  Building, 
  HelpCircle, 
  BookOpenCheck,
  ScrollText,
  Settings, // Re-added Settings icon as per previous discussions for Admin Panel
  FileText, // Für Dokumente-Seite
  FileDown // Für System & Berichte
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import type { UserPermission } from '@/types/rwk';
import { InactivityTimer } from '@/components/auth/InactivityTimer';

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
  const {
    user,
    signOut,
    loading, // Corrected: use 'loading' for Firebase Auth state
    userAppPermissions, 
    loadingAppPermissions, 
  } = useAuth();
  const router = useRouter();

  const isSuperAdmin = user && user.email === ADMIN_EMAIL;
  
  const isVereinsUser = useMemo(() => {
    return user &&
           user.email !== ADMIN_EMAIL &&
           !loadingAppPermissions && 
           userAppPermissions &&
           (userAppPermissions.role === 'vereinsvertreter' || userAppPermissions.role === 'mannschaftsfuehrer');
  }, [user, userAppPermissions, loadingAppPermissions]);

  const navItems: NavItem[] = [
    { href: '/', label: 'Startseite', icon: Home }, // Ensured label is "Startseite"
    { href: '/rwk-tabellen', label: 'RWK Tabellen', icon: TableIcon },
    { href: '/dokumente', label: 'Dokumente', icon: FileText },
    { href: '/updates', label: 'Updates', icon: Newspaper },
    { href: '/handbuch', label: 'Handbuch', icon: BookOpenCheck },
    { href: '/support', label: 'Support', icon: HelpCircle },
    { href: '/admin', label: 'Admin Panel', icon: Settings, adminOnly: true }, // Using Settings for Admin Panel
    { href: '/admin/exports', label: 'System & Berichte', icon: FileDown, adminOnly: true }, // Hinzugefügt für System & Berichte
    { href: '/verein/dashboard', label: 'Vereinsbereich', icon: Building, vereinOnly: true },
    { href: '/login', label: 'Login', icon: LogIn, hideWhenAuthed: true },
  ];

  const displayedRole = useMemo(() => {
    if (!user || loading || loadingAppPermissions) return null;
    if (isSuperAdmin) return null; // Super-Admin-Rolle wird nicht explizit angezeigt
    if (isVereinsUser && userAppPermissions?.role) {
      if (userAppPermissions.role === 'vereinsvertreter') return 'Vereinsvertreter';
      if (userAppPermissions.role === 'mannschaftsfuehrer') return 'Mannschaftsführer';
    }
    return null;
  }, [user, loading, loadingAppPermissions, isSuperAdmin, isVereinsUser, userAppPermissions]);

  return (
    <nav className="flex items-center space-x-1 lg:space-x-2">
      {navItems.map((item) => {
        if (loading && (item.adminOnly || item.vereinOnly || item.authRequired || item.hideWhenAuthed)) {
           return null; 
        }
        if (item.vereinOnly && !isSuperAdmin && loadingAppPermissions) { 
            return null;
        }

        let showItem = true;
        if (user) {
          if (item.hideWhenAuthed) showItem = false;
          if (item.adminOnly && !isSuperAdmin) showItem = false;
          if (item.vereinOnly && !isVereinsUser && !isSuperAdmin) showItem = false;
          if (item.vereinOnly && isSuperAdmin) showItem = false; 
        } else { 
          if (item.authRequired) showItem = false;
          if (item.adminOnly) showItem = false;
          if (item.vereinOnly) showItem = false;
        }
        
        if (!showItem) return null;
        
        const isActive = pathname === item.href || 
                         (item.href !== '/' && pathname.startsWith(item.href) && 
                          !((item.href === '/admin' && pathname.startsWith('/admin/')) ||
                            (item.href === '/verein/dashboard' && pathname.startsWith('/verein/')) 
                         )) ||
                         (pathname.startsWith('/admin') && item.href === '/admin') ||
                         (pathname.startsWith('/verein') && item.href === '/verein/dashboard');
        
        const showIcon = !user || item.href === '/' || item.href === '/rwk-tabellen' || item.href === '/dokumente' || item.href === '/updates' || item.href === '/handbuch' || item.href === '/support' || item.href === '/login' || (user && (item.adminOnly || item.vereinOnly));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 p-2 rounded-md",
              isActive
                ? 'text-primary bg-accent/20' 
                : 'text-muted-foreground',
              "max-md:p-1.5" 
            )}
            title={item.label} // Title attribute from item.label
          >
            {showIcon && <item.icon className="h-5 w-5 flex-shrink-0" />}
            <span className={cn( "hidden md:inline", !showIcon && "md:ml-0" )}>{item.label}</span>
          </Link>
        );
      })}
      {user && !loading && (
        <div className="flex items-center gap-2 ml-2 border-l pl-2">
           {user.email && (
             <span 
                className="text-xs text-muted-foreground hidden lg:inline max-w-[150px] truncate" 
                title={user.email}
              >
                {user.email}
              </span>
           )}
           {user.email && <UserCircle className="h-5 w-5 text-muted-foreground lg:hidden" title={user.email} />}
           {user && <InactivityTimer />}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
                await signOut();
                router.push('/'); 
            }}
            className="flex items-center gap-1.5 p-2 rounded-md text-muted-foreground hover:text-primary max-md:p-1.5"
            title="Logout"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      )}
    </nav>
  );
}