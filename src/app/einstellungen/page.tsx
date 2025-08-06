"use client";

import React from 'react';
import { DarkModeDemo } from '@/components/dark-mode-demo';

export default function SettingsPage() {
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">Einstellungen</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <DarkModeDemo />
      </div>
    </div>
  );
}
