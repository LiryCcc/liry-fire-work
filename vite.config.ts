import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  worker: { format: 'es' },
  resolve: {
    alias: {
      '@@': resolve(import.meta.dirname),
      '@': resolve(import.meta.dirname, 'src')
    }
  }
});
