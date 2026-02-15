// src/app/social/welcome/page.tsx
"use client";
import React from 'react';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trophy, Target, ArrowRight, Crown, Zap } from 'lucide-react';
import Link from 'next/link';

export default function SocialWelcomePage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Social Training
          </h1>
        </div>
        <p className="text-xl text-muted-foreground mb-6">
          Die erste Community-Plattform für Sportschützen
        </p>
      </div>

      {/* Was ist Social Training? */}
      <Card className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-800 dark:text-blue-200">
            🎯 Was ist Social Training?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-blue-700 dark:text-blue-300">
            Social Training bringt Sportschützen zusammen! Trainieren Sie nicht mehr allein, 
            sondern gemeinsam mit anderen Schützen in <strong>Trainingsgruppen</strong>, 
            nehmen Sie an <strong>Live-Wettkämpfen</strong> teil und vergleichen Sie 
            Ihre Leistungen in der <strong>Community</strong>.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 glass-subtle rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold text-purple-800 dark:text-purple-300">Trainingsgruppen</h3>
              <p className="text-sm text-purple-600 dark:text-purple-400">Gemeinsam trainieren macht mehr Spaß</p>
            </div>
            <div className="text-center p-4 glass-subtle rounded-lg">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-semibold text-orange-800 dark:text-orange-300">Live-Wettkämpfe</h3>
              <p className="text-sm text-orange-600 dark:text-orange-400">Real-time Wettkämpfe mit Ranglisten</p>
            </div>
            <div className="text-center p-4 glass-subtle rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold text-green-800 dark:text-green-300">Community</h3>
              <p className="text-sm text-green-600 dark:text-green-400">Andere Schützen entdecken</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Bereit loszulegen?</h2>
        <p className="text-muted-foreground">
          Werden Sie Teil der Schießsport-Community!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Link href="/schiessnachweis/login?redirect=/social">
              <Users className="h-5 w-5 mr-2" />
              Jetzt anmelden
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/schiessnachweis">
              <Target className="h-5 w-5 mr-2" />
              Zum Schießnachweis
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}