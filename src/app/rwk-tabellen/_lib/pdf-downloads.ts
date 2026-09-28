import { logError } from '@/lib/utils/secure-logger';
import type { CompetitionDisplayConfig, IndividualShooterDisplayData, LeagueDisplay } from '@/types/rwk';

type ToastFn = (opts: { title: string; description: string; variant?: 'destructive' }) => void;
type FetchShooters = (
  config: CompetitionDisplayConfig,
  numRounds: number,
  leagueId?: string | null
) => Promise<IndividualShooterDisplayData[]>;

const successToast = (toast: ToastFn) =>
  toast({ title: 'PDF erstellt', description: 'Die PDF-Datei wurde erfolgreich erstellt.' });

const errorToast = (toast: ToastFn, error: unknown) => {
  logError('Fehler beim Erstellen der PDF:', error);
  toast({ title: 'Fehler', description: 'Die PDF-Datei konnte nicht erstellt werden.', variant: 'destructive' });
};

/**
 * Mannschafts-PDF einer Liga: laedt Schuetzendaten, generiert PDF-Blob und loest den Download aus.
 */
export async function downloadLeagueTeamsPDF(
  league: LeagueDisplay,
  competition: CompetitionDisplayConfig,
  numRounds: number,
  fetchShooters: FetchShooters,
  toast: ToastFn
) {
  try {
    // Konsolidiert auf pdf-generator.fix (mit Logo, moderner Optik, Mobile/Safari-Support).
    // Diese Version uebernimmt Erzeugung UND Download selbst.
    const { generateLeaguePDFFixed } = await import('@/lib/utils/pdf-generator.fix');
    const shooterData = await fetchShooters(competition, numRounds, league.id);
    const tempLeague = { ...league, individualLeagueShooters: shooterData };
    await generateLeaguePDFFixed(tempLeague as any, numRounds, competition.year);
    successToast(toast);
  } catch (error) {
    errorToast(toast, error);
  }
}

/**
 * Einzelschuetzen-PDF einer Liga: der Generator uebernimmt Erzeugung UND Download.
 */
export async function downloadLeagueShootersPDF(
  league: LeagueDisplay,
  competition: CompetitionDisplayConfig,
  numRounds: number,
  fetchShooters: FetchShooters,
  toast: ToastFn
) {
  try {
    const { generateShootersPDFFixed } = await import('@/lib/utils/pdf-generator.fix');
    const shooterData = await fetchShooters(competition, numRounds, league.id);
    const tempLeague = { ...league, individualLeagueShooters: shooterData };
    await generateShootersPDFFixed(tempLeague as any, numRounds, competition.year);
    successToast(toast);
  } catch (error) {
    errorToast(toast, error);
  }
}

/**
 * Gesamtlisten-PDF (KK-Gewehr-Ehrungen / LGA-Gesamtliste): nutzt bereits geladene Schuetzendaten.
 */
export async function downloadGesamtlistePDF(
  tempLeague: LeagueDisplay,
  competition: CompetitionDisplayConfig,
  numRounds: number,
  toast: ToastFn
) {
  try {
    const { generateShootersPDFFixed } = await import('@/lib/utils/pdf-generator.fix');
    await generateShootersPDFFixed(tempLeague as any, numRounds, competition.year);
    successToast(toast);
  } catch (error) {
    errorToast(toast, error);
  }
}
