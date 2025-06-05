/**
 * @typedef {'KKG'|'KKS'|'KKP'|'LGA'|'LGS'|'LP'|'LPF'} FirestoreLeagueSpecificDiscipline
 */

/**
 * @typedef {Object} LeagueUpdateEntry
 * @property {string} id
 * @property {string} leagueId
 * @property {string} leagueName
 * @property {FirestoreLeagueSpecificDiscipline} leagueType
 * @property {number} competitionYear
 * @property {import('firebase/firestore').Timestamp} timestamp
 */

/**
 * @typedef {Object} Shooter
 * @property {string} id
 * @property {string} name
 * @property {'male'|'female'|'unknown'} gender
 */

/**
 * @typedef {Object} Team
 * @property {string} id
 * @property {string} name
 * @property {string} clubId
 * @property {string} leagueId
 * @property {number} competitionYear
 * @property {FirestoreLeagueSpecificDiscipline} leagueType
 * @property {Shooter[]} [shooters]
 */

/**
 * @typedef {Object} LeagueDisplay
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {string} [shortName]
 * @property {number} competitionYear
 * @property {Team[]} teams
 * @property {Shooter[]} [individualLeagueShooters]
 */

export const uiDisciplineFilterOptions = [
  { 
    value: 'kk', 
    label: 'Kleinkaliber (KK)', 
    firestoreTypes: ['KKG', 'KKS', 'KKP'] 
  }
];

export const leagueDisciplineOptions = [
  { value: 'all', label: 'Alle Disziplinen' }
];

export const MAX_SHOOTERS_PER_TEAM = 3;

/**
 * @param {FirestoreLeagueSpecificDiscipline} specificType
 * @returns {string}
 */
export function getUIDisciplineValueFromSpecificType(specificType) {
  const option = uiDisciplineFilterOptions.find(opt => opt.firestoreTypes.includes(specificType));
  return option ? option.value : '';
}