"use client";

import React from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { redirect } from 'next/navigation';

export default function StatisticsPage() {
  // Leite direkt zur Statistik-Seite weiter
  redirect('/statistik');
}
