// src/app/verein/handtabellen/page.tsx
"use client";
import { HandzettelGenerator } from '@/components/handzettel/HandzettelGenerator';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { useVereinAuth } from '../layout';

export default function VereinHandtabellenPage() {
  const { assignedClubId } = useVereinAuth();

  return (
    <HandzettelGenerator 
      showContactData={true}
      showGesamtTab={true}
      backButtonHref="/verein/dashboard"
    />
  );
}
