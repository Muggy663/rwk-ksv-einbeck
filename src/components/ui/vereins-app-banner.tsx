"use client";

import React, { useState } from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, Users, CreditCard, Calendar, Trophy } from 'lucide-react';

export function VereinsAppBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isVisible) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 via-purple-50 to-green-50 border-2 border-blue-200 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {!isMinimized ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-2xl">🎯</div>
                  <h3 className="text-xl font-bold text-blue-900">
                    NEU: Vereins-Manager App
                  </h3>
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                    JETZT VERFÜGBAR
                  </span>
                </div>
                
                <p className="text-blue-800 mb-4 font-medium">
                  Die Vereinssoftware ist jetzt eine <strong>eigenständige, spezialisierte App</strong> 
                  für professionelle Vereinsverwaltung! Alle Ihre Daten wurden sicher migriert.
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Users className="h-4 w-4" />
                    <span>Mitgliederverwaltung</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CreditCard className="h-4 w-4" />
                    <span>SEPA-Beiträge</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Calendar className="h-4 w-4" />
                    <span>Terminplanung</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Trophy className="h-4 w-4" />
                    <span>Digitales Schießbuch</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    asChild 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    <a 
                      href="https://vereins-manager.vercel.app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Vereins-Manager öffnen
                    </a>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setIsMinimized(true)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    Minimieren
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xl">🎯</div>
                  <span className="font-bold text-blue-900">Vereins-Manager App</span>
                  <Button 
                    asChild 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <a 
                      href="https://vereins-manager.vercel.app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Öffnen
                    </a>
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsMinimized(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Erweitern
                </Button>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
