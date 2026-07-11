import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/pipeline/**', 'src/constants.ts'],
      exclude: ['src/__tests__/**'],
      thresholds: {
        // Token pipeline functions: 100% required per QA.md
        'src/pipeline/validate-profile.ts': {
          lines: 100,
          functions: 100,
          branches: 90,
        },
        'src/pipeline/profile-to-tokens.ts': {
          lines: 90,
          functions: 100,
          branches: 80,
        },
      },
    },
    reporters: ['verbose'],
    // Snapshot files stored next to tests for easy review
    snapshotOptions: {
      snapshotFormat: { printBasicPrototype: false },
    },
  },
});
