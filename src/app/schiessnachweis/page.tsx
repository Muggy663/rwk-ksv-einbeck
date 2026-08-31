"use client";

import { useState, useEffect } from "react";
import { logError } from '@/lib/utils/secure-logger';
import { Target, Plus, Calendar, TrendingUp, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollToTopButton, usePullToRefresh } from "@/components/ui/mobile-enhancements";
import { SchießnachweisService } from "@/lib/services/schiessnachweis-service";
import { SchießStatistik, SchießEintrag } from "@/types/schiessnachweis";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Komponenten für neue Features
function LetzteEinträgeCard() {
  const [einträge, setEinträge] = useState<SchießEintrag[]>([]);
  
  useEffect(() => {
    const loadEinträge = async () => {
      try {
        const data = await SchießnachweisService.getEinträge();
        const sortedData = data.sort((a, b) => new Date(b.createdAt || b.datum).getTime() - new Date(a.createdAt || a.datum).getTime());
        setEinträge(sortedData.slice(0, 3).reverse());
      } catch (error) {
        logError('Fehler beim Laden der letzten Einträge:', error);
      }
    };
    loadEinträge();
  }, []);
  
  if (einträge.length === 0) return null;
  
  return (
    <Card className="mb-6 sm:mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          Letzte Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {einträge.map((eintrag) => (
            <div key={eintrag.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl border">
              <div className="flex-1">
                <div className="font-semibold text-base mb-1">{eintrag.disziplin}</div>
                <div className="text-sm text-muted-foreground">
                  {format(eintrag.datum, 'dd.MM.yyyy', { locale: de })} • {eintrag.schussAnzahl} Schüsse
                </div>
              </div>
              <Badge variant={eintrag.typ === 'wettkampf' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                {eintrag.ergebnis || eintrag.ergebnisGanzeRinge} Ringe
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TippDesTagesCard() {
  const tipps = [
    "🎯 Konzentrieren Sie sich auf Ihre Atmung - gleichmäßig ein- und ausatmen.",
    "👁️ Visieren Sie immer mit dem gleichen Auge - Konsistenz ist der Schlüssel.",
    "🧘 Entspannen Sie Ihre Schultern vor jedem Schuss - Verspannungen verschlechtern die Präzision.",
    "⏱️ Nehmen Sie sich Zeit für jeden Schuss - Hektik führt zu Fehlern.",
    "📝 Führen Sie ein Schießtagebuch - dokumentieren Sie Ihre Fortschritte.",
    "🎯 Üben Sie regelmäßig Trockenübungen zu Hause - auch ohne Munition.",
    "🔧 Prüfen Sie regelmäßig Ihre Ausrüstung - saubere Waffen schießen besser.",
    "🏃 Bleiben Sie körperlich fit - Ausdauer verbessert die Stabilität.",
    "🧠 Mentales Training ist genauso wichtig wie körperliches Training.",
    "🌟 Setzen Sie sich realistische Ziele und feiern Sie kleine Erfolge."
  ];
  
  const heute = new Date().getDate();
  const tippIndex = heute % tipps.length;
  
  return (
    <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-green-800 dark:text-green-200">
          <Target className="h-4 w-4 sm:h-5 sm:w-5" />
          💡 Tipp des Tages
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <p className="text-base sm:text-lg text-green-700 dark:text-green-300 leading-relaxed">
          {tipps[tippIndex]}
        </p>
      </CardContent>
    </Card>
  );
}

export default function SchießnachweisPage() {
  const [statistik, setStatistik] = useState<SchießStatistik | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  usePullToRefresh(async () => {
    await loadStatistik();
  });

  useEffect(() => {
    // Mobile Detection
    const checkMobile = () => {
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    loadStatistik();
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadStatistik = async () => {
    setIsLoading(true);
    try {
      const stats = await SchießnachweisService.getStatistik();
      setStatistik(stats);
    } catch (error) {
      logError('Fehler beim Laden der Statistik:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is logged in via Schießnachweis auth
  const [user, setUser] = useState<import('firebase/auth').User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase/config');
        unsubscribe = auth.onAuthStateChanged((user) => {
          setUser(user);
          setAuthLoading(false);
        });
      } catch (error) {
        setAuthLoading(false);
      }
    };
    checkAuth();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);
  
  // Show login prompt for non-authenticated users
  if (authLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="py-12">Lade...</div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" style={{ width: 120, height: 120, margin: 'auto' }} />
            <Target className="relative h-16 w-16 sm:h-20 sm:w-20 text-blue-600 mx-auto mb-4" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Schießnachweis
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8">
            Das digitale Schießtagebuch für Sportschützen
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-800 mb-2">Training dokumentieren</h3>
            <p className="text-sm text-blue-600">Erfassen Sie alle Trainings und Wettkämpfe digital</p>
          </Card>
          
          <Card className="text-center p-6 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-green-800 mb-2">PDF für Behörden</h3>
            <p className="text-sm text-green-600">Offizieller Nachweis für die Waffenbehörde</p>
          </Card>
        </div>

        {/* Login Section */}
        <Card className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-800 mb-2">
              🔐 Anmeldung erforderlich
            </CardTitle>
            <CardDescription className="text-blue-700">
              Für den Schießnachweis benötigen Sie einen kostenlosen Account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <Button asChild size="lg" className="w-full sm:w-auto px-8">
              <Link href="/login">
                Jetzt anmelden oder registrieren
              </Link>
            </Button>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-800 space-y-2">
                <p className="font-medium">
                  🎯 Ein Login für alles:
                </p>
                <ul className="text-left space-y-1 ml-4">
                  <li>✅ Schießnachweis (Digitales Schießtagebuch)</li>
                  <li>✅ RWK/KM (Bei entsprechender Berechtigung)</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800">
                💡 <strong>Neu hier?</strong> Nach der Registrierung haben Sie sofort Zugriff auf den Schießnachweis. Für RWK/KM-Vereinszugang kontaktieren Sie: <strong>rwk-leiter-ksve@gmx.de</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex justify-center items-center gap-2 sm:gap-3 mb-4">
          <Target className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Schießnachweis</h1>
            <Badge variant="secondary" className="mt-1 text-xs sm:text-sm">Digitales Schießtagebuch</Badge>
          </div>
        </div>
        
        <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-2">
          Das digitale Schießtagebuch für Sportschützen
          {!isLoading && statistik && statistik.letzteAktivität && (
            <span className="block text-sm mt-2">
              📅 Letzte Aktivität: {format(statistik.letzteAktivität, 'EEEE, d. MMMM yyyy', { locale: de })}
            </span>
          )}
        </p>
      </div>

      {/* Schnellaktionen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
        <Button asChild size="lg" className="flex items-center justify-center gap-3 h-16 text-base font-semibold">
          <Link href="/schiessnachweis/neuer-eintrag">
            <Plus className="h-6 w-6" />
            Neuer Eintrag
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-3 h-16 text-base font-semibold">
          <Link href="/schiessnachweis/eintraege">
            <Calendar className="h-6 w-6" />
            Alle Einträge
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-3 h-16 text-base font-semibold">
          <Link href="/schiessnachweis/statistiken">
            <TrendingUp className="h-6 w-6" />
            Statistiken
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="lg" className="flex items-center justify-center gap-3 h-16 text-base font-semibold">
          <Link href="/schiessnachweis/datensicherung">
            <FileText className="h-6 w-6" />
            Datensicherung
          </Link>
        </Button>
      </div>

      {/* Behörden-Nachweis (prominent hervorgehoben) */}
      <Card className="mb-6 sm:mb-8 border-2 border-green-300 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/60 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-green-900 dark:text-green-100 text-base sm:text-lg flex items-center gap-2 flex-wrap">
                  Nachweis für Behörden
                  <Badge className="bg-green-600 hover:bg-green-600 text-white text-xs">PDF</Badge>
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                  Offizieller Nachweis Ihrer Schießtätigkeit für die Waffenbehörde. Persönliche Daten eingeben, Zeitraum wählen und PDF erstellen – optional mit KI-Begleittext.
                </p>
              </div>
            </div>
            <Button
              asChild
              size="lg"
              className="w-full md:w-auto flex-shrink-0 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 h-14"
              disabled={isMobile}
            >
              {isMobile ? (
                <span>
                  <FileText className="h-5 w-5" />
                  Nur am Desktop
                </span>
              ) : (
                <Link href="/schiessnachweis/pdf-export">
                  <FileText className="h-5 w-5" />
                  Nachweis vorbereiten
                </Link>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profil-Button */}
      <div className="mb-6 sm:mb-8">
        <Button asChild variant="outline" size="lg" className="w-full flex items-center justify-center gap-3 h-14">
          <Link href="/schiessnachweis/profil">
            <User className="h-5 w-5" />
            Mein Profil bearbeiten
          </Link>
        </Button>
      </div>

      {/* Statistik-Übersicht */}
      {!isLoading && statistik && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{statistik.totalSchüsse}</div>
              <div className="text-sm sm:text-base text-blue-700 dark:text-blue-300 font-medium">Schüsse gesamt</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-green-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">{statistik.totalTrainings}</div>
              <div className="text-sm sm:text-base text-green-700 dark:text-green-300 font-medium">Trainings</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-purple-200">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">{statistik.totalWettkämpfe}</div>
              <div className="text-sm sm:text-base text-purple-700 dark:text-purple-300 font-medium">Wettkämpfe</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Erste Schritte für neue Nutzer */}
      {!isLoading && statistik && statistik.totalSchüsse === 0 && (
        <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-blue-800 dark:text-blue-200 text-lg sm:text-xl">🎯 Willkommen beim Schießnachweis!</CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300 text-sm sm:text-base">
              Beginnen Sie mit Ihrem ersten Eintrag und verfolgen Sie Ihren Fortschritt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                <strong>So geht's:</strong> Tragen Sie Ihre Trainings und Wettkämpfe ein → Sehen Sie Ihre Statistiken → Exportieren Sie Nachweise für Behörden
              </p>
              <Button asChild className="w-full sm:w-auto h-12 sm:h-auto">
                <Link href="/schiessnachweis/neuer-eintrag">
                  <Plus className="h-4 w-4 mr-2" />
                  Ersten Eintrag erstellen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* E-Mail Bestätigungs-Hinweis mit Countdown */}
      {user && !user.emailVerified && (() => {
        const createdAt = user.metadata?.creationTime ? new Date(user.metadata.creationTime) : new Date();
        const deadline = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const isExpired = daysLeft === 0;
        return (
          <Card className={`mb-6 sm:mb-8 border-2 ${
            isExpired
              ? 'bg-red-50 dark:bg-red-950/20 border-red-400'
              : daysLeft <= 2
              ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-400'
              : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`text-2xl font-bold min-w-[3rem] text-center rounded-lg p-2 ${
                  isExpired ? 'bg-red-200 text-red-800' : daysLeft <= 2 ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'
                }`}>
                  {isExpired ? '!' : daysLeft}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${
                    isExpired ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {isExpired
                      ? '⚠️ Bestätigungsfrist abgelaufen'
                      : `⏳ Noch ${daysLeft} Tag${daysLeft !== 1 ? 'e' : ''} zur E-Mail-Bestätigung`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bitte bestätige deine E-Mail-Adresse. Schau auch im Spam-Ordner nach!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Tipp des Tages */}
      <TippDesTagesCard />

      {/* Letzte Einträge */}
      {!isLoading && statistik && statistik.totalSchüsse > 0 && (
        <LetzteEinträgeCard />
      )}

{/* Datenbank-Info */}



      
      {/* Informationen */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle>ℹ️ Informationen</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 text-sm sm:text-base text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-lg">📊</span>
              <span><strong>CSV/Excel:</strong> Zum Bearbeiten und Sichern in Tabellenkalkulationen</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">📝</span>
              <span><strong>PDF:</strong> Offizieller Nachweis für Waffenbehörden</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <span><strong>Import:</strong> Unterstützt das gleiche Format wie der Export</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">💾</span>
              <span><strong>Datenbank:</strong> Alle Daten werden automatisch sicher in der Datenbank gespeichert (Multi-Device-Zugriff)</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-lg">☕</span>
              <span><strong>Unterstützung:</strong> <Link href="https://paypal.me/marcelbuenger1989" target="_blank" className="text-blue-600 hover:text-blue-800 underline font-medium">PayPal Spende</Link> für Infrastruktur</span>
            </p>
          </div>
        </CardContent>
      </Card>

<ScrollToTopButton />
      </div>
  );
}
