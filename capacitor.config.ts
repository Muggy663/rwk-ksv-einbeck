import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'de.rwk.einbeck',
  appName: 'RWK Einbeck',
  webDir: '.next/static',
  appVersion: '0.9.4.1',
  server: {
    url: 'https://rwk-einbeck.de',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    // Statusleiste-Konfiguration
    backgroundColor: "#ffffff",
    // statusBarStyle entfernt - nicht unterstützt in dieser Version
    // Navigation Bar sichtbar lassen für Home/Zurück-Buttons
    // androidWindowSoftInputMode entfernt - nicht unterstützt
    // fullScreen: false,
    // Zusätzliche Konfiguration für bessere Navigation
    // navigationBarStyle: "dark", - entfernt
    // navigationBarColor: "#ffffff", - entfernt
    // WebView Konfiguration
    webContentsDebuggingEnabled: false,
    // Touch-Optimierungen
    // mixedContentMode: 'compatibility', - entfernt
    // Bessere Performance
    // hardwareAccelerated: true - entfernt
  }
};

export default config;
