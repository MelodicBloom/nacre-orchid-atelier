/**
 * @nacre/shaders — public API
 *
 * Nacre Orchid Atelier material shader presets.
 * Gate 1 scope: nacre-pearl-bloom preset only.
 */

// Preset
export { nacrePearlBloom, NACRE_PEARL_BLOOM_DEFAULTS, NACRE_PEARL_BLOOM_FRAG_PATH } from './presets/nacre-pearl-bloom.js';

// Types
export type {
  BaseUniforms,
  NacrePearlBloomUniforms,
  ShaderPreset,
  ShaderTier,
  ShaderCapabilityResult,
  ShaderQualityTier,
  ShaderQualityProfile,
} from './shader-types.js';

// Uniform utilities
export {
  mergeNacrePearlBloomUniforms,
  clamp01,
  clampColor,
  clampPointer,
  clampNacrePearlBloomUniforms,
} from './uniforms/shader-uniforms.js';

// Token mapper
export { tokensToNacrePearlBloomUniforms } from './uniforms/tokens-to-uniforms.js';
export type { TokenSetSlice } from './uniforms/tokens-to-uniforms.js';

// Runtime
export { detectShaderCapability, bestTier } from './runtime/shader-capability.js';
export { resolveQualityProfile } from './runtime/shader-quality-tier.js';

// Fallback
export { pearlBloomFallbackCss, pearlBloomFallbackStyle } from './fallback/pearl-bloom-fallback.js';
export type { PearlBloomFallbackOptions } from './fallback/pearl-bloom-fallback.js';
