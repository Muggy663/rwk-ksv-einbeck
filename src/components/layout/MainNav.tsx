// src/components/layout/MainNav.tsx
"use client";
import React, { useMemo } from 'react'; // Added useMemo
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Table, 
  Newspaper, 
  HardHat, 
  LogIn,
  LogOut, 
  UserCircle, 
  ShieldCheck, 
  Building, 
  HelpCircle, 
  BookOpenCheck,
  ScrollText // For RWK-Ordnung
} from 'lucide-react';
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
  const {
    user,
    signOut,
    loading, 
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
  }, [user, loadingAppPermissions, userAppPermissions]);

  const navItems: NavItem[] = [
    { href: '/', label: 'Start', icon: Home },
    { href: '/rwk-tabellen', label: 'RWK Tabellen', icon: Table },
    { href: '/updates', label: 'Updates', icon: Newspaper },
    { href: '/km', label: 'KM', icon: HardHat },
    { href: '/handbuch', label: 'Handbuch', icon: BookOpenCheck },
    { href: '/rwk-ordnung', label: 'RWK-Ordnung', icon: ScrollText },
    { href: '/support', label: 'Support', icon: HelpCircle },
    { href: '/admin', label: 'Admin Panel', icon: ShieldCheck, adminOnly: true },
    { href: '/verein/dashboard', label: 'Mein Verein', icon: Building, vereinOnly: true },
    { href: '/login', label: 'Login', icon: LogIn, hideWhenAuthed: true },
  ];

  const displayedRole = useMemo(() => {
    if (isSuperAdmin) return "Super-Admin"; // This won't be shown next to email anyway due to nav logic
    if (isVereinsUser && userAppPermissions?.role) {
      if (userAppPermissions.role === 'vereinsvertreter') return 'Vereinsvertreter';
      if (userAppPermissions.role === 'mannschaftsfuehrer') return 'Mannschaftsführer';
    }
    return null;
  }, [isSuperAdmin, isVereinsUser, userAppPermissions]);

  return (
    <nav className="flex items-center space-x-1 lg:space-x-2">
      {navItems.map((item) => {
        // Initial checks for auth state loading
        if (loading && (item.adminOnly || item.vereinOnly || item.authRequired || item.hideWhenAuthed)) {
           return null; 
        }
        // For vereinOnly links, also wait for app permissions to load if not super admin
        if (item.vereinOnly && !isSuperAdmin && loadingAppPermissions) {
            return null;
        }

        // Logic for logged-in user
        if (user) {
          if (item.hideWhenAuthed) return null;
          if (item.adminOnly && !isSuperAdmin) return null;
          if (item.vereinOnly && !isVereinsUser) return null; // Hide if not a VereinsUser
          if (item.vereinOnly && isSuperAdmin) return null; // SuperAdmin should not see "Mein Verein"
        } else { // Logic for logged-out user
          if (item.authRequired) return null;
          if (item.adminOnly) return null;
          if (item.vereinOnly) return null;
        }
        
        const isItemActive = pathname === item.href || 
                             (item.href !== '/' && pathname.startsWith(item.href) && !(item.href === '/admin' && pathname.startsWith('/admin/')) && !(item.href === '/verein/dashboard' && pathname.startsWith('/verein/'))) ||
                             (item.href === '/admin' && pathname.startsWith('/admin')) ||
                             (item.href === '/verein/dashboard' && pathname.startsWith('/verein'));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 p-2 rounded-md",
              isItemActive
                ? 'text-primary bg-accent/20' 
                : 'text-muted-foreground',
              "max-md:p-1.5" 
            )}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
      {user && !loading && ( // Show user info and logout only if user is loaded and present
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
            <LogOut className="h-5 w-5" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      )}
    </nav>
  );
}
