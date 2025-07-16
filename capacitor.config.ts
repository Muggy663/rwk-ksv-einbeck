import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.rwk.einbeck',
  appName: 'RWK Einbeck',
  webDir: '.next/static',
  server: {
    url: 'https://rwk-app-einbeck.vercel.app',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;
