import { defineConfig } from 'vitest/config';
import path from 'path';

// Vitest-Konfiguration für Unit-Tests der reinen Berechnungslogik.
// Bewusst schlank: Node-Umgebung (keine Browser-/DOM-Abhängigkeit nötig),
// nur Dateien unter src/**/__tests__ bzw. *.test.ts werden ausgeführt.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    // Dummy-Firebase-Werte, damit Module, die src/lib/firebase/config.ts
    // transitiv importieren, in Tests laden können. KEINE echten Credentials –
    // in Unit-Tests wird nie eine echte Firebase-Verbindung aufgebaut.
    env: {
      NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
    },
  },
  resolve: {
    alias: {
      // Spiegelt das Next.js-Alias "@/..." -> "src/..." wider.
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
