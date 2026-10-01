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
  },
  resolve: {
    alias: {
      // Spiegelt das Next.js-Alias "@/..." -> "src/..." wider.
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
