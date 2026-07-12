/**
 * nacre-pearl-bloom.ts
 *
 * Typed export for the nacre-pearl-bloom shader preset.
 * Bundles metadata, default uniforms, and the GLSL source path together
 * so consumers import a single stable object rather than loose files.
 */

import type { NacrePearlBloomUniforms, ShaderPreset } from '../shader-types.js';
import meta from './nacre-pearl-bloom.meta.json';

export const NACRE_PEARL_BLOOM_DEFAULTS: Readonly<NacrePearlBloomUniforms> = {
  u_time:           0,
  u_resolution:     [1, 1],
  u_pointer:        [0.5, 0.5],
  u_intensity:      0.72,   // 1 - revealed_concealed(0.68) rounded
  u_iridescence:    0.60,   // tactile_spectral axis position
  u_shimmerOpacity: 0.12,   // nacre-effect-shimmer-opacity token default
  u_baseColor:      [0.92, 0.93, 0.95], // hsl(200 20% 94%) linearised
  u_accentColor:    [0.68, 0.52, 0.82], // hsl(290 55% 62%) linearised
  u_reducedMotion:  0,
};

export const NACRE_PEARL_BLOOM_FRAG_PATH =
  './nacre-pearl-bloom.frag.glsl' as const;

export const nacrePearlBloom: ShaderPreset<NacrePearlBloomUniforms> = {
  id:           meta.id,
  family:       meta.family,
  displayName:  meta.displayName,
  description:  meta.description,
  tier:         meta.tier as 'webgl2',
  fallbackTier: meta.fallbackTier as 'css',
  contextBudget: meta.contextBudget,
  defaults:     NACRE_PEARL_BLOOM_DEFAULTS,
  fragPath:     NACRE_PEARL_BLOOM_FRAG_PATH,
  meta,
};

export type { NacrePearlBloomUniforms };
