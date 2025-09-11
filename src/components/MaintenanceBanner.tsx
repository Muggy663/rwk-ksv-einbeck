// src/components/MaintenanceBanner.tsx
"use client";

import React from 'react';
import { AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function MaintenanceBanner() {
  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 mb-2">
              🚧 Wartungsarbeiten geplant
            </h3>
            <div className="text-sm text-orange-800 space-y-2">
              <p>
                <strong>Ab 15.09.2025:</strong> Wartungsarbeiten für System-Updates
              </p>
              <p>
                Während der Wartungsarbeiten ist kein Login möglich. Die App wird für System-Updates nicht verfügbar sein.
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs bg-orange-100 rounded-lg p-2">
                <Calendar className="h-4 w-4" />
                <span>
                  <strong>Wichtig:</strong> RWK Luftdruck Meldeschluss ist am 15.09.2025!
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}