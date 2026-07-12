import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/**/*.d.ts'],
      thresholds: {
        'src/uniforms/tokens-to-uniforms.ts': {
          lines: 100,
          functions: 100,
          branches: 90,
        },
        'src/runtime/shader-capability.ts': {
          lines: 90,
          functions: 100,
        },
      },
    },
    reporters: ['verbose'],
  },
});
