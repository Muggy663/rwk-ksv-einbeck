"use client";
import React from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
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
  User,
  Settings,
  Trophy,
  Users,
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
    { href: '/dokumente', label: 'Dokumente', icon: FileText },
  ];

  const betaRoutes = [
    { href: user ? '/social' : '/social/welcome', label: 'Social Training', icon: Users },
    { href: '/schiessnachweis', label: 'Schießnachweis', icon: Target },
  ];

  const helpRoutes = [
    { href: '/handbuch', label: 'Handbuch', icon: BookOpen },
    { href: '/schiesssport-erklaerung', label: 'Schießsport erklärt', icon: BookOpen },
    { href: '/kreisverband', label: 'Für Kreisverbände', icon: MessageSquare },
    { href: '/support', label: 'Support', icon: MessageSquare },
  ];

  const adminRoutes = [
    { href: '/admin', label: 'Admin Panel', icon: ShieldCheck },
    { href: '/protests', label: 'Proteste', icon: AlertTriangle },
    { href: '/news', label: 'News', icon: Newspaper },
    { href: '/notifications', label: 'Benachrichtigungen', icon: Bell },
    { href: '/updates', label: 'Updates', icon: Bell },
  ];

  const userRoutes = [
    { href: '/dashboard-auswahl', label: 'Arbeitsbereich', icon: Settings },
  ];
  
  // Vereins-spezifische Routes nur für Vereinssoftware anzeigen
  const isOnClubSoftware = pathname.startsWith('/vereinssoftware');
  const clubRoutes = isOnClubSoftware ? [
    { href: '/vereinssoftware', label: 'Vereinssoftware', icon: User },
  ] : [];

  const NavSection = ({ title, routes }: { title: string; routes: any[] }) => (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
        {title}
      </h3>
      <div className="space-y-1">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.href || 
            (route.href !== '/' && pathname.startsWith(route.href));
          
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
              {route.href === '/schiessnachweis' && <span className="text-xs text-red-600 dark:text-red-400 font-semibold ml-2">Beta</span>}
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
        
        <NavSection title="Beta Features" routes={betaRoutes} />
        
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
