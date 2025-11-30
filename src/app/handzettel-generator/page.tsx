// src/app/handzettel-generator/page.tsx
"use client";
import { HandzettelGenerator } from '@/components/handzettel/HandzettelGenerator';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

export default function HandzettelGeneratorPage() {
  return (
    <HandzettelGenerator 
      showContactData={false}
      backButtonHref="/dokumente"
    />
  );
}

