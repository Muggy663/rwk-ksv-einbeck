// src/lib/services/km-startrechte-service.ts

export const DISZIPLIN_GRUPPEN = {
  'luftwaffen': ['1.', '2.'], // LG + LP
  'kleinkaliber_gewehr': ['3.'], // KKG
  'kleinkaliber_pistole': ['4.'], // KKP
  'grosskaliber': ['5.'], // GK
  'armbrust': ['6.'], // Armbrust
  'laufende_scheibe': ['7.'], // LS
  'sonderdisziplinen': ['8.', '9.', '10.', '11.', '12.'] // Rest
};

export function getDisziplinGruppe(spoNummer: string): string {
  for (const [gruppe, prefixes] of Object.entries(DISZIPLIN_GRUPPEN)) {
    if (prefixes.some(prefix => spoNummer.startsWith(prefix))) {
      return gruppe;
    }
  }
  return 'sonderdisziplinen';
}

export function getStartVereinForDisziplin(schuetze: any, disziplin: any): string | null {
  if (!disziplin.spoNummer) {
    return schuetze.rwkClubId || schuetze.kmClubId || schuetze.clubId || null;
  }
  
  // Prüfe spezifische KM-Startrechte
  if (schuetze.kmStartrechte) {
    const gruppe = getDisziplinGruppe(disziplin.spoNummer);
    const startrecht = schuetze.kmStartrechte[gruppe];
    if (startrecht) return startrecht;
  }
  
  // Fallback: Hauptverein
  return schuetze.rwkClubId || schuetze.kmClubId || schuetze.clubId || null;
}

export const STARTRECHT_LABELS = {
  'luftwaffen': 'Luftwaffen (LG/LP)',
  'kleinkaliber_gewehr': 'Kleinkaliber Gewehr',
  'kleinkaliber_pistole': 'Kleinkaliber Pistole', 
  'grosskaliber': 'Großkaliber',
  'armbrust': 'Armbrust',
  'laufende_scheibe': 'Laufende Scheibe',
  'sonderdisziplinen': 'Sonderdisziplinen'
};