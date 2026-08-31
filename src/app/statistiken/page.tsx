"use client";

import React from 'react';
import { redirect } from 'next/navigation';

export default function StatisticsPage() {
  // Leite direkt zur Statistik-Seite weiter
  redirect('/statistik');
}
