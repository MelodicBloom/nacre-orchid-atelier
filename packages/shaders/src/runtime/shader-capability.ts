/**
 * shader-capability.ts
 *
 * Runtime WebGL capability detection.
 * Returns the best available rendering tier for the current environment.
 *
 * NODE SAFE: all WebGL detection is guarded behind typeof checks so this
 * module can be imported in Vitest (Node) without crashing.
 *
 * Tier precedence: webgl2 > webgl1 > css
 * highp float precision is required for nacre-pearl-bloom thin-film maths.
 * If only mediump is available, the shader will still compile but banding
 * may be visible in thin-film interference fringes.
 */

import type { ShaderCapabilityResult, ShaderTier } from '../shader-types.js';

export function detectShaderCapability(): ShaderCapabilityResult {
  // Server / Node / test environment
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return {
      tier: 'css',
      webgl2: false,
      webgl1: false,
      highpSupported: false,
      mediumpSupported: false,
      reason: 'Non-browser environment — CSS fallback only',
    };
  }

  const canvas = document.createElement('canvas');

  // Try WebGL2
  const gl2 = canvas.getContext('webgl2');
  if (gl2) {
    const vp = gl2.getShaderPrecisionFormat(gl2.VERTEX_SHADER, gl2.HIGH_FLOAT);
    const fp = gl2.getShaderPrecisionFormat(gl2.FRAGMENT_SHADER, gl2.HIGH_FLOAT);
    const highp = (vp?.precision ?? 0) > 0 && (fp?.precision ?? 0) > 0;
    gl2.getExtension('WEBGL_lose_context')?.loseContext();
    return {
      tier: 'webgl2',
      webgl2: true,
      webgl1: true,
      highpSupported: highp,
      mediumpSupported: true,
      reason: highp
        ? 'WebGL2 with highp float — full quality'
        : 'WebGL2 available but highp not supported — medium quality',
    };
  }

  // Try WebGL1
  const gl1 =
    canvas.getContext('webgl') ??
    (canvas.getContext as (id: string) => WebGLRenderingContext | null)(
      'experimental-webgl',
    );
  if (gl1) {
    const fp = gl1.getShaderPrecisionFormat(
      gl1.FRAGMENT_SHADER,
      (gl1 as WebGLRenderingContext).HIGH_FLOAT,
    );
    const highp = (fp?.precision ?? 0) > 0;
    const mp = gl1.getShaderPrecisionFormat(
      gl1.FRAGMENT_SHADER,
      (gl1 as WebGLRenderingContext).MEDIUM_FLOAT,
    );
    const mediump = (mp?.precision ?? 0) > 0;
    (gl1 as WebGLRenderingContext)
      .getExtension('WEBGL_lose_context')
      ?.loseContext();
    return {
      tier: 'webgl1',
      webgl2: false,
      webgl1: true,
      highpSupported: highp,
      mediumpSupported: mediump,
      reason: highp
        ? 'WebGL1 with highp float — degraded quality (no WebGL2)'
        : 'WebGL1 mediump only — visible banding possible in thin-film fringes',
    };
  }

  // No WebGL
  return {
    tier: 'css',
    webgl2: false,
    webgl1: false,
    highpSupported: false,
    mediumpSupported: false,
    reason: 'WebGL not available — CSS gradient fallback',
  };
}

export function bestTier(capability: ShaderCapabilityResult): ShaderTier {
  return capability.tier;
}
