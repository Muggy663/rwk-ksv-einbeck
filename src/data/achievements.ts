import { Achievement } from '@/types/achievements';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_100_shots',
    title: 'Erste 100 Schuss',
    description: 'Schieße deine ersten 100 Schuss',
    icon: '🎯',
    rarity: 'bronze',
    requirement: 100,
    category: 'training'
  },
  {
    id: 'first_1000_shots',
    title: 'Tausender-Marke',
    description: '1000 Schuss erreicht',
    icon: '🏆',
    rarity: 'silver',
    requirement: 1000,
    category: 'training'
  },
  {
    id: 'first_duel_win',
    title: 'Erster Sieg',
    description: 'Gewinne dein erstes Duell',
    icon: '⚔️',
    rarity: 'bronze',
    requirement: 1,
    category: 'social'
  },
  {
    id: 'duel_master',
    title: 'Duell-Meister',
    description: 'Gewinne 10 Duelle',
    icon: '👑',
    rarity: 'gold',
    requirement: 10,
    category: 'social'
  }
];
