import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@snake/shared': fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
      '@snake/engine': fileURLToPath(new URL('./packages/engine/src/index.ts', import.meta.url)),
      '@snake/ai': fileURLToPath(new URL('./packages/ai/src/index.ts', import.meta.url)),
      '@snake/levels': fileURLToPath(new URL('./packages/levels/src/index.ts', import.meta.url)),
      '@snake/failure': fileURLToPath(new URL('./packages/failure/src/index.ts', import.meta.url)),
      '@snake/simulation': fileURLToPath(new URL('./packages/simulation/src/index.ts', import.meta.url)),
      '@snake/renderer': fileURLToPath(new URL('./packages/renderer/src/index.ts', import.meta.url)),
    },
  },
  test: { include: ['packages/**/test/**/*.test.ts', 'apps/**/test/**/*.test.ts'], environment: 'node', coverage: { enabled: false } },
});
