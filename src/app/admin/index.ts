// src/app/admin/index.ts
// Exportiere die Admin-Routen für einfachen Zugriff

export const adminRoutes = [
  {
    name: 'Dashboard',
    path: '/admin',
    icon: 'LayoutDashboard'
  },
  {
    name: 'Dokumente',
    path: '/admin/documents',
    icon: 'FileText'
  },
  {
    name: 'Benutzer',
    path: '/admin/user-management',
    icon: 'Users'
  },
  {
    name: 'Vereine',
    path: '/admin/clubs',
    icon: 'Building'
  },
  {
    name: 'Mannschaften',
    path: '/admin/teams',
    icon: 'Users'
  },
  {
    name: 'Ligen',
    path: '/admin/leagues',
    icon: 'Trophy'
  },
  {
    name: 'Saisons',
    path: '/admin/seasons',
    icon: 'Calendar'
  },
  {
    name: 'Ergebnisse',
    path: '/admin/results',
    icon: 'BarChart'
  },
  {
    name: 'Support-Tickets',
    path: '/admin/support-tickets',
    icon: 'LifeBuoy'
  }
];