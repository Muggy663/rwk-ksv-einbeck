import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.rwk.einbeck',
  appName: 'RWK Einbeck',
  webDir: '.next/static',
  appVersion: '0.9.9.5',
  server: {
    url: 'https://rwk-einbeck.de',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;
