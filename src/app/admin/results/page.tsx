
// src/app/admin/results/page.tsx
"use client";

import SharedResultsPage from '@/components/results/shared-results-complete';

export default function AdminResultsPage() {
  return (
    <SharedResultsPage 
      userRole="admin"
      backHref="/admin"
      dashboardHref="/admin"
    />
  );
}
