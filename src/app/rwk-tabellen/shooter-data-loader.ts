import { fetchShooterDataForCompetition } from '@/lib/services/shooter-data-service';
import { CompetitionDisplayConfig, IndividualShooterDisplayData } from '@/types/rwk';

/**
 * Lädt Einzelschützendaten für die RWK-Tabellen
 */
export async function loadShooterData(
  config: CompetitionDisplayConfig,
  numRounds: number,
  leagueFilter?: string | null
): Promise<IndividualShooterDisplayData[]> {
  try {
    return await fetchShooterDataForCompetition(config, numRounds, leagueFilter);
  } catch (error) {
    console.error('Fehler beim Laden der Einzelschützendaten:', error);
    return [];
  }
}
