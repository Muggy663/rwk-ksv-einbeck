// src/components/layout/MainNav.tsx
"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Table, Newspaper, HardHat, LogIn, LogOut, UserCircle, ShieldCheck, Building, HelpCircle, BookOpenCheck } from 'lucide-react'; // Changed BookOpenCheckIcon to BookOpenCheck
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
  // `loading` from useAuth refers to the Firebase Auth loading state
  const { user, signOut, loading, userAppPermissions, loadingAppPermissions } = useAuth(); 
  const router = useRouter();

  const isSuperAdmin = user && user.email === ADMIN_EMAIL;
  // A user is considered a "Vereins-User" if they are logged in, not the super admin,
  // and have loaded permissions without an error, and have a valid role.
  const isVereinsUser = user && 
                        user.email !== ADMIN_EMAIL && 
                        !loadingAppPermissions && 
                        userAppPermissions && 
                        (userAppPermissions.role === 'vereinsvertreter' || userAppPermissions.role === 'mannschaftsfuehrer');


  const navItems: NavItem[] = [
    { href: '/', label: 'Startseite', icon: Home },
    { href: '/rwk-tabellen', label: 'RWK Tabellen', icon: Table },
    { href: '/updates', label: 'Updates', icon: Newspaper },
    { href: '/km', label: 'KM', icon: HardHat },
    { href: '/handbuch', label: 'Handbuch', icon: BookOpenCheck },
    { href: '/support', label: 'Support', icon: HelpCircle },
    { href: '/admin', label: 'Admin Panel', icon: ShieldCheck, adminOnly: true },
    { href: '/verein/dashboard', label: 'Mein Verein', icon: Building, vereinOnly: true },
    { href: '/login', label: 'Login', icon: LogIn, hideWhenAuthed: true },
  ];

  return (
    <nav className="flex items-center space-x-1 lg:space-x-2">
      {navItems.map((item) => {
        // Use 'loading' (Firebase Auth loading) for general auth-dependent links
        if (loading && (item.authRequired || item.adminOnly || item.vereinOnly)) return null;
        if (user && item.hideWhenAuthed) return null;
        if (!user && item.authRequired && !loading) return null;
        
        if (item.adminOnly && !isSuperAdmin) return null;
        if (item.vereinOnly && !isVereinsUser) return null; // Use isVereinsUser here
        
        // Prevent VVs from seeing Admin Panel and Admins from seeing "Mein Verein" directly
        if (item.vereinOnly && isSuperAdmin) return null;
        if (item.adminOnly && isVereinsUser) return null; // And VV shouldn't see Admin Panel

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
           {user.email && <span className="text-sm text-muted-foreground hidden md:inline max-w-[150px] truncate" title={user.email}>{user.email}</span>}
           {user.email && <UserCircle className="h-6 w-6 text-muted-foreground md:hidden" title={user.email} />}
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
