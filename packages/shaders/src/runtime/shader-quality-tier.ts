/**
 * shader-quality-tier.ts
 *
 * Maps device capability + user preferences to a ShaderQualityProfile.
 * Controls canvas count budget, animation speed multiplier, and resolution cap.
 */

import type { ShaderCapabilityResult, ShaderQualityProfile } from '../shader-types.js';

export function resolveQualityProfile(
  capability: ShaderCapabilityResult,
  reducedMotion: boolean,
): ShaderQualityProfile {
  if (reducedMotion) {
    return {
      tier: 'css-only',
      maxActiveCanvases: 0,
      motionMultiplier: 0,
      maxResolution: 0,
      reason: 'prefers-reduced-motion — all WebGL canvases replaced with static CSS fallback',
    };
  }

  switch (capability.tier) {
    case 'webgl2':
      return {
        tier: capability.highpSupported ? 'high' : 'medium',
        maxActiveCanvases: 1,   // only detail/focused surface; gallery cards use CSS
        motionMultiplier: 1.0,
        maxResolution: 2048,
        reason: capability.reason,
      };
    case 'webgl1':
      return {
        tier: capability.highpSupported ? 'medium' : 'low',
        maxActiveCanvases: 1,
        motionMultiplier: 0.8,
        maxResolution: 1024,
        reason: capability.reason,
      };
    default:
      return {
        tier: 'css-only',
        maxActiveCanvases: 0,
        motionMultiplier: 0,
        maxResolution: 0,
        reason: 'No WebGL — CSS gradient fallback',
      };
  }
}
