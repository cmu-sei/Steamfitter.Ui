import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [angular({ tsconfig: 'tsconfig.vitest.json' })],
  resolve: {
    alias: [
      { find: 'src/', replacement: path.resolve(__dirname, 'src') + '/' },
      { find: /^~(.*)/, replacement: '$1' },
    ],
  },
  optimizeDeps: {
    entries: [],
    include: ['@material/material-color-utilities'],
  },
  ssr: {
    noExternal: ['@material/material-color-utilities', '@cmusei/crucible-common'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.vitest.ts'],
    include: ['src/app/**/*.vitest.ts'],
    reporters: ['default'],
  },
});
