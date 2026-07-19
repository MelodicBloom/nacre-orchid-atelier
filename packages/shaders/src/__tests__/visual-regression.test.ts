/**
 * visual-regression.test.ts
 *
 * Guards the nacre-pearl-bloom reference render contract.
 *
 * Phase 1 (now): asserts uniform constants and pixel-diff thresholds are
 *   correctly specified. PNG presence tests skip gracefully if not yet captured.
 *
 * Phase 2 (after first PNG commit): add pixelmatch + pngjs and promote the
 *   PENDING tests using the guide below.
 *
 * Pixel-diff tolerance:
 *   maxChannelDelta  1.5%  (~3.8 units on 0-255 scale)
 *   maxMismatchRatio 2.0%  of total pixels
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';

const QA    = resolve(__dirname, '../../../../.github/qa-assets');
const H_REF = resolve(QA, 'nacre-pearl-bloom-seed-42-headless.png');
const P_REF = resolve(QA, 'nacre-pearl-bloom-seed-42-playwright.png');

export const PIXEL_DIFF_THRESHOLD = {
  maxChannelDelta:  0.015,
  maxMismatchRatio: 0.020,
};

// Fixed reference uniforms — seed 42, t=0, resolution 800x600
// ANY change to these values requires regenerating both reference PNGs.
const REF = {
  u_time:           0.0,
  u_resolution:     [800, 600],
  u_pointer:        [0.5, 0.5],
  u_intensity:      0.72,
  u_iridescence:    0.60,
  u_shimmerOpacity: 0.12,
  u_baseColor:      [0.8262, 0.8488, 0.8879],
  u_accentColor:    [0.3677, 0.2449, 0.5768],
  u_reducedMotion:  0.0,
};

describe('visual-regression — uniform contract', () => {
  it('all 9 uniform keys are defined', () => {
    for (const [k, v] of Object.entries(REF)) expect(v, k).toBeDefined();
  });
  it('u_time is 0 (static deterministic frame)', () => {
    expect(REF.u_time).toBe(0);
  });
  it('u_resolution is 800×600', () => {
    expect(REF.u_resolution).toEqual([800, 600]);
  });
  it('u_pointer is centred', () => {
    expect(REF.u_pointer).toEqual([0.5, 0.5]);
  });
  it('u_reducedMotion is 0 (motion-active reference)', () => {
    expect(REF.u_reducedMotion).toBe(0);
  });
  it('u_intensity is 0.72 (nacre-gate revealed_concealed inverse)', () => {
    expect(REF.u_intensity).toBe(0.72);
  });
  it('u_iridescence is 0.60 (tactile_spectral axis)', () => {
    expect(REF.u_iridescence).toBe(0.60);
  });
  it('all vec3 colour channels are in [0, 1]', () => {
    for (const c of [...REF.u_baseColor, ...REF.u_accentColor]) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });
  it('pixel-diff thresholds are within safe bounds', () => {
    expect(PIXEL_DIFF_THRESHOLD.maxChannelDelta).toBeLessThanOrEqual(0.05);
    expect(PIXEL_DIFF_THRESHOLD.maxMismatchRatio).toBeLessThanOrEqual(0.05);
  });
});

describe('visual-regression — reference PNG presence', () => {
  it('PENDING: headless PNG exists after capture run', () => {
    if (!existsSync(H_REF)) {
      console.warn(`  ⏳ Not yet captured. Run:\n     node packages/shaders/scripts/capture-reference-headless.js`);
      return;
    }
    expect(existsSync(H_REF)).toBe(true);
  });
  it('PENDING: Playwright PNG exists after capture run', () => {
    if (!existsSync(P_REF)) {
      console.warn(`  ⏳ Not yet captured. Run:\n     npx ts-node packages/shaders/scripts/render-reference-playwright.ts`);
      return;
    }
    expect(existsSync(P_REF)).toBe(true);
  });
});

/**
 * PROMOTION GUIDE — Phase 2
 *
 * 1. Run both capture scripts and commit the resulting PNGs.
 * 2. npm install --save-dev pixelmatch pngjs
 * 3. Replace the PENDING tests with:
 *
 *   import { PNG } from 'pngjs';
 *   import pixelmatch from 'pixelmatch';
 *   import { readFileSync } from 'fs';
 *
 *   it('headless render matches reference within threshold', () => {
 *     const ref    = PNG.sync.read(readFileSync(H_REF));
 *     const actual = PNG.sync.read(readFileSync(H_ACTUAL)); // regenerated in CI
 *     const diff   = new Uint8Array(ref.width * ref.height * 4);
 *     const count  = pixelmatch(ref.data, actual.data, diff, ref.width, ref.height, {
 *       threshold: PIXEL_DIFF_THRESHOLD.maxChannelDelta,
 *     });
 *     expect(count / (ref.width * ref.height)).toBeLessThanOrEqual(
 *       PIXEL_DIFF_THRESHOLD.maxMismatchRatio
 *     );
 *   });
 *
 * 4. Add a CI step that regenerates H_ACTUAL before tests run.
 */
