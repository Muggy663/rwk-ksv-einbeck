"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home, 
  FileBarChart, 
  TrendingUp,
  CalendarDays,
  FileText,
  BookOpen,
  MessageSquare,
  Bell,
  ShieldCheck,
  Settings,
  AlertTriangle,
  Newspaper,
  Target
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isAdmin = user?.email === 'admin@rwk-einbeck.de';

  const publicRoutes = [
    { href: '/', label: 'Startseite', icon: Home },
    { href: '/rwk-tabellen', label: 'RWK Tabellen', icon: FileBarChart },
    { href: '/statistiken', label: 'Statistiken', icon: TrendingUp },
    { href: '/termine', label: 'Termine', icon: CalendarDays },
    { href: '/ligalisten', label: 'Ligalisten', icon: FileText },
    { href: '/dokumente', label: 'Dokumente', icon: FileText },
  ];

  // Eigenständiges Zusatz-Feature (kein Kern-RWK/KM) – bewusst abgesetzt.
  const extraRoutes = [
    { href: '/schiessnachweis', label: 'Schießnachweis', icon: Target },
  ];

  const helpRoutes = [
    { href: '/handbuch', label: 'Handbuch', icon: BookOpen },
    { href: '/schiesssport-erklaerung', label: 'Schießsport erklärt', icon: BookOpen },
    { href: '/support', label: 'Support', icon: MessageSquare },
    { href: '/feedback', label: 'Feedback geben', icon: MessageSquare },
  ];

  const adminRoutes = [
    { href: '/admin', label: 'Admin Panel', icon: ShieldCheck },
    { href: '/protests', label: 'Proteste', icon: AlertTriangle },
    { href: '/news', label: 'News', icon: Newspaper },
    { href: '/notifications', label: 'Benachrichtigungen', icon: Bell },
  ];

  const userRoutes = [
    { href: '/dashboard-auswahl', label: 'Arbeitsbereich', icon: Settings },
  ];
  
  // Vereins-spezifische Routes entfernt (Vereinssoftware eingestellt)
  const clubRoutes: any[] = [];

  const NavSection = ({ title, routes }: { title: string; routes: any[] }) => (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
        {title}
      </h3>
      <div className="space-y-1">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.href || (route.href !== '/' && pathname.startsWith(route.href));
          
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 mr-3" />
              {route.label}

              {(route.href === '/social' || route.href === '/social/welcome') && <span className="text-xs text-green-600 dark:text-green-400 font-semibold ml-2">NEU</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-64 h-full bg-background border-r flex flex-col">
      <div className="p-6 pt-8 flex-1 overflow-y-auto">
        <NavSection title="Hauptbereich" routes={publicRoutes} />

        {/* Zusatz-Feature – abgesetzt mit Trenner und extra Abstand */}
        <div className="mt-2 mb-6 border-t pt-5">
          <h3 className="mb-3 flex items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Extra
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium normal-case text-primary">
              Bonus
            </span>
          </h3>
          <div className="space-y-1">
            {extraRoutes.map((route) => {
              const Icon = route.icon;
              const isActive = pathname === route.href || pathname.startsWith(route.href);
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {route.label}
                </Link>
              );
            })}
          </div>
        </div>
        
        {user && (
          <NavSection title="Mein Bereich" routes={userRoutes} />
        )}
        
        {user && clubRoutes.length > 0 && (
          <NavSection title="Mein Verein" routes={clubRoutes} />
        )}
        
        {isAdmin && (
          <NavSection title="Administration" routes={adminRoutes} />
        )}
        
        <NavSection title="Hilfe & Support" routes={helpRoutes} />
      </div>
    </div>
  );
}
