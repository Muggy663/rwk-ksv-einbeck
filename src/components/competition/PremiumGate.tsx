"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Zap, Users, BarChart3, Shield } from "lucide-react";
import Link from "next/link";

interface PremiumGateProps {
  feature: string;
  description: string;
  children?: React.ReactNode;
}

export function PremiumGate({ feature, description, children }: PremiumGateProps) {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Crown className="h-16 w-16 text-yellow-600" />
              <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                Premium
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl text-yellow-900">{feature}</CardTitle>
          <CardDescription className="text-yellow-700 text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Premium Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="h-6 w-6 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">Live-Wettkämpfe</h3>
              </div>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Unbegrenzte Wettkämpfe erstellen</li>
                <li>• Echtzeit-Ranglisten</li>
                <li>• Alle DSB-Disziplinen</li>
                <li>• Flexible Zeitlimits</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold text-yellow-900">Erweiterte Gruppen</h3>
              </div>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Unbegrenzte Gruppengröße</li>
                <li>• Erweiterte Verwaltung</li>
                <li>• Gruppen-Statistiken</li>
                <li>• Priority-Support</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-yellow-900">Premium-Statistiken</h3>
              </div>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Detaillierte Leistungsanalysen</li>
                <li>• Fortschritts-Tracking</li>
                <li>• Vergleiche mit anderen</li>
                <li>• Export-Funktionen</li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-6 w-6 text-purple-600" />
                <h3 className="font-semibold text-yellow-900">Vereins-Features</h3>
              </div>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Vereins-Lizenzen verfügbar</li>
                <li>• Mannschafts-Wettkämpfe</li>
                <li>• Trainer-Dashboard</li>
                <li>• Vereins-Statistiken</li>
              </ul>
            </div>
          </div>

          {/* Preise */}
          <div className="bg-white p-6 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4 text-center">
              🎯 Premium-Pläne
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold mb-2">Einzellizenz</h4>
                <div className="text-2xl font-bold text-blue-600 mb-2">Kostenlos*</div>
                <p className="text-sm text-muted-foreground mb-3">
                  *Während der Testphase
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Alle Premium-Features</li>
                  <li>• Persönlicher Support</li>
                  <li>• Keine Werbung</li>
                </ul>
              </div>
              
              <div className="text-center p-4 border-2 border-yellow-400 rounded-lg bg-yellow-50">
                <div className="flex justify-center mb-2">
                  <Badge className="bg-yellow-500">Empfohlen</Badge>
                </div>
                <h4 className="font-semibold mb-2">Vereinslizenz</h4>
                <div className="text-2xl font-bold text-yellow-600 mb-2">Auf Anfrage</div>
                <p className="text-sm text-muted-foreground mb-3">
                  Für Schützenvereine
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  <li>• Alle Einzellizenz-Features</li>
                  <li>• Unbegrenzte Mitglieder</li>
                  <li>• Vereins-Dashboard</li>
                  <li>• Priority-Support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-yellow-600 hover:bg-yellow-700">
              <Link href="/license-request">
                <Crown className="h-5 w-5 mr-2" />
                Premium-Lizenz anfragen
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/social">
                Zurück zu Social Training
              </Link>
            </Button>
          </div>

          {/* Zusätzliche Info */}
          <div className="text-center">
            <p className="text-sm text-yellow-700">
              💡 <strong>Testphase:</strong> Alle Premium-Features sind aktuell kostenlos verfügbar. 
              Fordern Sie jetzt Ihre Lizenz an!
            </p>
          </div>

          {children}
        </CardContent>
      </Card>
    </div>
  );
}
