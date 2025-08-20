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
    statusBarStyle: "dark",
    statusBarOverlaysWebView: false,
    // Navigation Bar sichtbar lassen für Home/Zurück-Buttons
    androidWindowSoftInputMode: "adjustResize",
    fullScreen: false,
    // Zusätzliche Konfiguration für bessere Navigation
    navigationBarStyle: "dark",
    navigationBarColor: "#ffffff",
    // WebView Konfiguration
    webContentsDebuggingEnabled: false,
    // Verhindert Status Bar Überlagerung
    statusBarOverlaysWebView: false,
    // Touch-Optimierungen
    mixedContentMode: 'compatibility',
    // Bessere Performance
    hardwareAccelerated: true
  }
};

export default config;
