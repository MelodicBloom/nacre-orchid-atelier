import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/__tests__/**'],
      thresholds: {
        'src/MaterialSurface.tsx': {
          lines: 80,
          functions: 80,
          branches: 70,
        },
      },
    },
    reporters: ['verbose'],
  },
});
