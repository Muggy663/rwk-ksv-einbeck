// src/components/layout/MainNav.tsx
"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  Table, 
  Newspaper, 
  HardHat, 
  LogIn, // WICHTIG: LogIn hier hinzugefügt
  LogOut, 
  UserCircle, 
  ShieldCheck, 
  Building, 
  HelpCircle, 
  BookOpenCheck,
  ListChecks, // Hinzugefügt für Admin-Navigation
  Edit3,      // Hinzugefügt für Admin-Navigation
  UserCog,    // Hinzugefügt für Admin-Navigation
  MessagesSquare // Hinzugefügt für Admin-Navigation
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
    loading, // Auth-Ladezustand
    userAppPermissions,
    loadingAppPermissions, 
    appPermissionsError
  } = useAuth();
  const router = useRouter();

  const isSuperAdmin = user && user.email === ADMIN_EMAIL;
  // VereinsUser-Prüfung basiert jetzt auf den geladenen userAppPermissions
  const isVereinsUser = user &&
                        user.email !== ADMIN_EMAIL &&
                        !loadingAppPermissions && // Stelle sicher, dass Permissions geladen sind
                        userAppPermissions &&
                        (userAppPermissions.role === 'vereinsvertreter' || userAppPermissions.role === 'mannschaftsfuehrer') &&
                        userAppPermissions.clubId && userAppPermissions.clubId.trim() !== '';


  const navItems: NavItem[] = [
    { href: '/', label: 'Startseite', icon: Home },
    { href: '/rwk-tabellen', label: 'RWK Tabellen', icon: Table },
    { href: '/updates', label: 'Updates', icon: Newspaper },
    { href: '/km', label: 'KM', icon: HardHat }, // KM Icon beibehalten, ggf. später anpassen
    { href: '/handbuch', label: 'Handbuch', icon: BookOpenCheck },
    { href: '/support', label: 'Support', icon: HelpCircle }, // Geändert zu HelpCircle
    { href: '/admin', label: 'Admin Panel', icon: ShieldCheck, adminOnly: true },
    { href: '/verein/dashboard', label: 'Mein Verein', icon: Building, vereinOnly: true },
    { href: '/login', label: 'Login', icon: LogIn, hideWhenAuthed: true },
  ];

  return (
    <nav className="flex items-center space-x-1 lg:space-x-2">
      {navItems.map((item) => {
        // Bedingte Anzeige basierend auf Ladezuständen und Rollen
        if (loading && (item.adminOnly || item.vereinOnly || item.authRequired || item.hideWhenAuthed)) {
           // Optional: Einen Skeleton/Platzhalter während des Ladens anzeigen
           // return <div key={item.href} className="p-2"><Skeleton className="h-5 w-20" /></div>;
           return null; // Oder einfach nichts, bis der Ladezustand geklärt ist
        }
        if (item.vereinOnly && loadingAppPermissions) {
            // return <div key={item.href} className="p-2"><Skeleton className="h-5 w-20" /></div>;
            return null;
        }

        if (user && item.hideWhenAuthed) return null;
        if (!user && item.authRequired) return null; // item.authRequired könnte nützlich sein
        
        if (item.adminOnly && !isSuperAdmin) return null;
        if (item.vereinOnly && !isVereinsUser) return null; // Verwende die aktualisierte isVereinsUser Logik
        
        // Verhindere, dass Admin den "Mein Verein" Link sieht und VV/MF den "Admin Panel" Link
        if (item.vereinOnly && isSuperAdmin) return null;
        if (item.adminOnly && isVereinsUser) return null;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 p-2 rounded-md",
              (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href !== '/admin' && item.href !== '/verein/dashboard') || (item.href === '/admin' && pathname.startsWith('/admin')) || (item.href === '/verein/dashboard' && pathname.startsWith('/verein')))
                ? 'text-primary bg-accent/20' // Aktiver Link hervorgehoben
                : 'text-muted-foreground',
              "max-md:p-1.5" // Kleineres Padding auf kleineren Bildschirmen
            )}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
      {user && !loading && ( // Zeige Benutzerinfo und Logout nur wenn User geladen und vorhanden
        <div className="flex items-center gap-2">
           {user.email && <span className="text-sm text-muted-foreground hidden lg:inline max-w-[150px] truncate" title={user.email}>{user.email}</span>}
           {user.email && <UserCircle className="h-6 w-6 text-muted-foreground lg:hidden" title={user.email} />}
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
