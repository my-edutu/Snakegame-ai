import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@snake/shared': fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
      '@snake/engine': fileURLToPath(new URL('./packages/engine/src/index.ts', import.meta.url)),
      '@snake/ai': fileURLToPath(new URL('./packages/ai/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/**/test/**/*.test.ts'],
    environment: 'node',
    coverage: { enabled: false },
  },
});
