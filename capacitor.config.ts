import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.rwk.einbeck',
  appName: 'RWK Einbeck',
  webDir: '.next/static',
  appVersion: '0.9.1.0',
  server: {
    url: 'https://rwk-einbeck.de',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    // Statusleiste-Konfiguration
    backgroundColor: "#ffffff",
    statusBarStyle: "dark",
    statusBarOverlaysWebView: false,
    // Vollbild-Modus deaktivieren, damit die Statusleiste sichtbar bleibt
    androidWindowSoftInputMode: "adjustResize",
    fullScreen: false
  }
};

export default config;
