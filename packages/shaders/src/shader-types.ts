/**
 * shader-types.ts
 *
 * Canonical type definitions for all Nacre Orchid Atelier shader presets.
 * Every preset must satisfy ShaderPreset<U> where U extends BaseUniforms.
 */

// ── Base uniform contract ─────────────────────────────────────────────────────
// Every preset MUST declare these uniforms. ShaderCanvas reads them for
// its RAF loop, pointer tracking, and reduced-motion gate.
export interface BaseUniforms {
  /** Elapsed time in seconds. Frozen when u_reducedMotion = 1. */
  readonly u_time: number;
  /** Canvas size in pixels [width, height]. */
  readonly u_resolution: readonly [number, number];
  /** Normalised pointer position [0-1, 0-1]. */
  readonly u_pointer: readonly [number, number];
  /** 1.0 when prefers-reduced-motion is active. */
  readonly u_reducedMotion: number;
}

// ── nacre-pearl-bloom specific uniforms ────────────────────────────────────
export interface NacrePearlBloomUniforms extends BaseUniforms {
  /** Material intensity — derived from (1 - revealed_concealed axis position). */
  readonly u_intensity: number;
  /** Thin-film iridescence strength — derived from tactile_spectral axis position. */
  readonly u_iridescence: number;
  /** Idle shimmer opacity — from nacre-effect-shimmer-opacity token. */
  readonly u_shimmerOpacity: number;
  /** Base surface colour as linearised RGB [0-1]. From color.surface.0 token. */
  readonly u_baseColor: readonly [number, number, number];
  /** Accent bloom colour as linearised RGB [0-1]. From color.material.orchid token. */
  readonly u_accentColor: readonly [number, number, number];
}

// ── Shader tier ───────────────────────────────────────────────────────────────
export type ShaderTier = 'webgl2' | 'webgl1' | 'css';

// ── Shader preset descriptor ───────────────────────────────────────────────────
export interface ShaderPreset<U extends BaseUniforms> {
  /** Stable preset identifier. Used as a key in token mapper and registry. */
  readonly id: string;
  /** Visual family group. Drives gallery tab organisation. */
  readonly family: string;
  readonly displayName: string;
  readonly description: string;
  /** Preferred rendering tier. */
  readonly tier: ShaderTier;
  /** Fallback tier if preferred tier is unavailable. */
  readonly fallbackTier: ShaderTier;
  /**
   * Max simultaneous live WebGL canvases for this preset.
   * Prevents exceeding browser context budget (~8-16 contexts).
   * Gallery cards MUST use static fallback; only detail/focused
   * views may instantiate a live canvas.
   */
  readonly contextBudget: number;
  /** Default uniform values, fully typed. */
  readonly defaults: Readonly<U>;
  /** Relative path to the fragment shader GLSL file. */
  readonly fragPath: string;
  /** Raw metadata JSON. */
  readonly meta: Record<string, unknown>;
}

// ── Capability query result ────────────────────────────────────────────────────
export interface ShaderCapabilityResult {
  readonly tier: ShaderTier;
  readonly webgl2: boolean;
  readonly webgl1: boolean;
  readonly highpSupported: boolean;
  readonly mediumpSupported: boolean;
  readonly reason: string;
}

// ── Quality tier ──────────────────────────────────────────────────────────────
export type ShaderQualityTier = 'high' | 'medium' | 'low' | 'css-only';

export interface ShaderQualityProfile {
  readonly tier: ShaderQualityTier;
  readonly maxActiveCanvases: number;
  /** Multiplier applied to shimmer animation speed. 0.0 = frozen. */
  readonly motionMultiplier: number;
  /** Max texture size hint in pixels. */
  readonly maxResolution: number;
  readonly reason: string;
}
