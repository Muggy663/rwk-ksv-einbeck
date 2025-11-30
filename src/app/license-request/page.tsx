"use client";

import React from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { LicenseRequestForm } from '@/components/license-request-form';

export default function LicenseRequestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <LicenseRequestForm />
    </div>
  );
}
