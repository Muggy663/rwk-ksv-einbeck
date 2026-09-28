"use client";
import { Suspense } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from '@/components/ui/button';
import { TableIcon as TableIconLucide, Loader2, AlertTriangle, User, Users, LineChart as LineChartIcon, Info } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { RwkTabellenPageLoadingSkeleton } from './_components/RwkTabellenPageLoadingSkeleton';
import { ShooterDetailModalContent } from './_components/ShooterDetailModalContent';
import { MannschaftenTab } from './_components/MannschaftenTab';
import { EinzelschuetzenTab } from './_components/EinzelschuetzenTab';
import { useRwkTabellenData } from './_hooks/useRwkTabellenData';

function RwkTabellenPageComponent() {
  const data = useRwkTabellenData();
  const {
    availableCompetitions, isLoadingInitialCompetitions,
    selectedCompetition, activeTab, setActiveTab,
    loadingData, error,
    selectedIndividualLeagueFilter, setSelectedIndividualLeagueFilter,
    lastClickedLeagueId,
    isShooterDetailModalOpen, setIsShooterDetailModalOpen,
    selectedShooterForDetail, currentNumRoundsState,
    handleCompetitionChange, pageTitle,
  } = data;

  // Conditional rendering for loading initial config
  if (isLoadingInitialCompetitions || !selectedCompetition) {
    return <RwkTabellenPageLoadingSkeleton title={pageTitle || 'Lade Konfiguration...'} />;
  }

  return (
    <div className="space-y-8" style={{
      touchAction: 'manipulation',
      WebkitOverflowScrolling: 'touch',
      WebkitTransform: 'translateZ(0)',
      willChange: 'scroll-position'
    }}>
      {/* Moderner Header mit Gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackHref="/" />
            <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-primary text-primary-foreground shrink-0">
              <TableIconLucide className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground">Rundenwettkampf-Tabellen</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-muted-foreground hover:text-foreground hover:bg-muted p-2 shrink-0"
              onClick={() => document.getElementById('rwk-legend')?.scrollIntoView({ behavior: 'smooth' })}
              aria-label="Legende anzeigen"
            >
              <Info className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label className="text-sm font-semibold text-foreground sm:min-w-[90px]">Wettkampf</label>
            <NativeSelect
              value={selectedCompetition ? `${selectedCompetition.year}-${selectedCompetition.discipline}` : ""}
              onValueChange={(value) => handleCompetitionChange(value)}
              disabled={availableCompetitions.length === 0 || loadingData}
              className="w-full sm:flex-1 sm:max-w-md shadow-sm bg-white dark:bg-gray-800 font-medium"
              placeholder={availableCompetitions.length === 0 ? "Keine Wettkämpfe" : "Wettkampf wählen"}
              options={availableCompetitions.map(comp => ({
                value: `${comp.year}-${comp.discipline}`,
                label: comp.displayName
              }))}
            />
            <Button asChild variant="outline" className="w-full sm:w-auto border-primary/40 bg-background !text-foreground hover:!text-foreground hover:bg-muted">
              <Link href="/statistik" className="flex items-center justify-center !text-foreground">
                <LineChartIcon className="mr-2 h-4 w-4" />
                Statistiken
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value as 'mannschaften' | 'einzelschützen');
        // Context-Aware Navigation: Verwende zuletzt geöffnete Liga
        if (value === 'einzelschützen' && lastClickedLeagueId) {
          // Aktualisiere Liga-Filter immer mit zuletzt geöffneter Liga
          if (selectedIndividualLeagueFilter !== lastClickedLeagueId) {
            setSelectedIndividualLeagueFilter(lastClickedLeagueId);

          }
        }
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mb-6 shadow-md">
          <TabsTrigger value="mannschaften" className="py-2.5"><Users className="mr-2 h-5 w-5" />Mannschaften</TabsTrigger>
          <TabsTrigger value="einzelschützen" className="py-2.5"><User className="mr-2 h-5 w-5" />Einzelschützen</TabsTrigger>
        </TabsList>

        {loadingData && <div className="flex flex-col items-center justify-center py-10 text-muted-foreground mt-6"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-lg">Lade Daten für {selectedCompetition.displayName}...</p></div>}
        
        {!loadingData && error && (
          <Card className="shadow-lg border-destructive"><CardHeader><CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Fehler beim Laden</CardTitle></CardHeader><CardContent className="text-destructive-foreground bg-destructive/10 p-6"><p>{error}</p><p className="text-sm mt-1">Bitte sicherstellen, dass Saisons für das gewählte Jahr/Disziplin existieren, Status "Laufend" haben und Firestore-Indizes korrekt sind.</p></CardContent></Card>
        )}

        <TabsContent value="mannschaften">
          <MannschaftenTab data={data} />
        </TabsContent>

        <TabsContent value="einzelschützen">
          <EinzelschuetzenTab data={data} />
        </TabsContent>
      </Tabs>

      <Dialog open={isShooterDetailModalOpen} onOpenChange={setIsShooterDetailModalOpen}>
        <DialogContent className="sm:max-w-2xl"> {/* Increased width for better chart display */}
          {selectedShooterForDetail && (
            <ShooterDetailModalContent
              shooterData={selectedShooterForDetail}
              numRounds={currentNumRoundsState}
              seasonId={
                (data.teamData?.leagues.find(l => l.id === selectedShooterForDetail.leagueId) as any)?.seasonId
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RwkTabellenPage() {
  return (
    <Suspense fallback={<RwkTabellenPageLoadingSkeleton title="RWK Tabellen laden..." />}>
      <RwkTabellenPageComponent />
    </Suspense>
  );
}
