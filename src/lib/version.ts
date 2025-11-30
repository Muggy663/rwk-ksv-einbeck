import packageJson from '../../package.json';
import { logError, logWarn, logInfo, logDebug } from '@/lib/utils/secure-logger';

export const APP_VERSION = {
  web: packageJson.version,
  android: '0.9.4.1'
};

// Social Training Platform Release - Version 2.0.0
export const SOCIAL_TRAINING_VERSION = '2.0.0';
export const RELEASE_NAME = 'Social Training Platform';
export const PREVIOUS_VERSION = '1.9.0';

// What's new in 2.0.0
export const WHATS_NEW = {
  version: '2.0.0',
  title: 'Social Training Platform',
  features: [
    '👥 Trainingsgruppen - Gemeinsam trainieren mit Freunden',
    '⚔️ Live-Wettkämpfe - Real-time Wettkämpfe in allen Disziplinen', 
    '🎯 Duelle-System - 1vs1 Herausforderungen zwischen Schützen',
    '📊 Community-Statistiken - Erweiterte Leistungsanalysen',
    '🏅 Achievements - Abzeichen für Training und Erfolge',
    '🔔 Smart Notifications - DSGVO-konforme Benachrichtigungen'
  ]
};

export const getVersionString = () => `Version: ${APP_VERSION.web} | Android: ${APP_VERSION.android}`;
