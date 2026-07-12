/**
 * shader-uniforms.ts
 *
 * Utilities for working with typed uniform objects:
 * - Merging partial overrides onto defaults
 * - Clamping uniform values to their declared ranges
 * - Serialising uniform objects for WebGL upload
 */

import type { BaseUniforms, NacrePearlBloomUniforms } from '../shader-types.js';
import { NACRE_PEARL_BLOOM_DEFAULTS } from '../presets/nacre-pearl-bloom.js';

// ── Merge helpers ───────────────────────────────────────────────────────────

/** Shallow-merge partial uniform overrides onto the nacre-pearl-bloom defaults. */
export function mergeNacrePearlBloomUniforms(
  overrides: Partial<NacrePearlBloomUniforms>,
): NacrePearlBloomUniforms {
  return { ...NACRE_PEARL_BLOOM_DEFAULTS, ...overrides };
}

/** Clamp a scalar uniform to [0, 1]. */
export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** Clamp a vec3 uniform to [0, 1] per channel. */
export function clampColor(
  c: readonly [number, number, number],
): readonly [number, number, number] {
  return [clamp01(c[0]), clamp01(c[1]), clamp01(c[2])];
}

/** Clamp a vec2 pointer to [0, 1]. */
export function clampPointer(
  p: readonly [number, number],
): readonly [number, number] {
  return [clamp01(p[0]), clamp01(p[1])];
}

/** Validate and clamp all range-bounded uniforms in NacrePearlBloomUniforms. */
export function clampNacrePearlBloomUniforms(
  u: NacrePearlBloomUniforms,
): NacrePearlBloomUniforms {
  return {
    ...u,
    u_pointer:        clampPointer(u.u_pointer),
    u_intensity:      clamp01(u.u_intensity),
    u_iridescence:    clamp01(u.u_iridescence),
    u_shimmerOpacity: clamp01(u.u_shimmerOpacity),
    u_baseColor:      clampColor(u.u_baseColor),
    u_accentColor:    clampColor(u.u_accentColor),
    u_reducedMotion:  clamp01(u.u_reducedMotion),
  };
}
