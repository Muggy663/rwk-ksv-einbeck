// /app/verein/ergebnisse/page.tsx
"use client";
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, AlertCircle } from 'lucide-react';
import { useVereinAuth } from '@/app/verein/layout';
import SharedResultsPage from '@/components/results/shared-results-complete';

export default function VereinErgebnissePage() {
  const { userPermission, loadingPermissions, permissionError, assignedClubId, currentClubId } = useVereinAuth();

  if (loadingPermissions) {
    return <div className="flex justify-center items-center py-12"><Loader className="h-12 w-12 animate-spin text-primary mr-3" /><p>Lade Berechtigungen...</p></div>;
  }

  if (permissionError) {
    return <div className="p-6"><Card className="border-destructive bg-destructive/5"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertCircle className="mr-2 h-5 w-5" /> {permissionError}</CardTitle></CardHeader></Card></div>;
  }

  const effectiveClubId = currentClubId || assignedClubId;
  const userRole = userPermission?.role === 'superadmin' ? 'admin' :
                  userPermission?.clubRoles && Object.values(userPermission.clubRoles).includes('SPORTLEITER') ? 'sportleiter' :
                  'mannschaftsfuehrer';

  return (
    <SharedResultsPage
      userRole={userRole}
      backHref="/verein/dashboard"
      dashboardHref="/verein/dashboard"
      clubId={effectiveClubId ?? undefined}
    />
  );
}
