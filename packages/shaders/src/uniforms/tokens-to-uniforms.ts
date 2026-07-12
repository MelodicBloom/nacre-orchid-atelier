/**
 * tokens-to-uniforms.ts
 *
 * Maps a NacreTokenSet (output of profileToTokens()) to the typed uniform
 * interface of nacre-pearl-bloom.
 *
 * This is the critical determinism bridge:
 *   inquiry profile  →  profileToTokens()  →  tokensToNacrePearlBloomUniforms()
 *   └─ same profile + same seed always yields byte-identical uniforms
 *
 * RULE: This function must be pure. No randomness, no Date, no Math.random.
 * Any non-determinism here breaks the visual QA reference render contract.
 */

import type { NacrePearlBloomUniforms } from '../shader-types.js';
import { NACRE_PEARL_BLOOM_DEFAULTS } from '../presets/nacre-pearl-bloom.js';

/**
 * Minimal slice of NacreTokenSet that this mapper needs.
 * Using a structural type so @nacre/tokens is a peerDependency,
 * not a hard import — keeps the shaders package independently testable.
 */
export interface TokenSetSlice {
  readonly color: {
    readonly surface: ReadonlyArray<{ readonly value: string; readonly cssVar: string }>;
    readonly accent:  ReadonlyArray<{ readonly value: string; readonly cssVar: string }>;
    readonly text:    ReadonlyArray<{ readonly value: string; readonly cssVar: string }>;
    readonly border:  ReadonlyArray<{ readonly value: string; readonly cssVar: string }>;
  };
  readonly motion: {
    readonly enter: { readonly duration: number; readonly easing: string; readonly sourceRhythm: string };
    readonly idle:  { readonly duration: number };
  };
}

// ── HSL → linear RGB ─────────────────────────────────────────────────────────
// Parses "hsl(H S% L%)" strings from token values and converts to
// linear-light RGB [0-1] for direct upload as WebGL vec3 uniforms.
// CSS HSL is in display P3-adjacent space; we apply approximate gamma
// linearisation (sRGB gamma ~2.2) so the shader operates in linear light.

function hslToLinearRgb(hsl: string): readonly [number, number, number] {
  // Parse "hsl(H S% L%)" or "hsl(H S L)" (modern CSS space-separated)
  const m = hsl.match(
    /hsl\(\s*([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?\s*\)/,
  );
  if (!m) return NACRE_PEARL_BLOOM_DEFAULTS.u_baseColor;

  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;

  // HSL -> sRGB
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number): number => {
    let tt = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const r = s === 0 ? l : hue2rgb(h + 1 / 3);
  const g = s === 0 ? l : hue2rgb(h);
  const b = s === 0 ? l : hue2rgb(h - 1 / 3);

  // sRGB -> linear (gamma 2.2 approximation)
  const lin = (v: number): number =>
    v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.2);

  return [lin(r), lin(g), lin(b)];
}

// ── Main mapper ───────────────────────────────────────────────────────────────

/**
 * Maps a NacreTokenSet (or compatible slice) to NacrePearlBloomUniforms.
 *
 * Mapping table:
 *   u_intensity       ←  1 - revealed_concealed axis (encoded in surface lightness)
 *                        Proxy: (1 - surface[0].lightness_normalised)
 *   u_iridescence     ←  tactile_spectral axis — directly stored in shimmerOpacity
 *                        token; we derive from the accent saturation hue distance
 *   u_shimmerOpacity  ←  effect.shimmer.opacity (12% default from meta)
 *   u_baseColor       ←  color.surface[0] converted to linear RGB
 *   u_accentColor     ←  color.accent[0] (primary accent = orchid) linear RGB
 *   u_reducedMotion   ←  caller must supply (OS preference, not a token)
 *   u_time / u_resolution / u_pointer  ←  runtime-only, not from tokens
 */
export function tokensToNacrePearlBloomUniforms(
  tokens: TokenSetSlice,
  runtimeOverrides?: {
    readonly u_time?: number;
    readonly u_resolution?: readonly [number, number];
    readonly u_pointer?: readonly [number, number];
    readonly u_reducedMotion?: number;
  },
): NacrePearlBloomUniforms {
  const surfaceColor = tokens.color.surface[0]?.value ?? 'hsl(200 15% 96%)';
  const accentColor  = tokens.color.accent[0]?.value  ?? 'hsl(290 60% 55%)';

  const baseColor   = hslToLinearRgb(surfaceColor);
  const accentRgb   = hslToLinearRgb(accentColor);

  // Derive intensity from accent saturation:
  // orchid accent has high saturation — we use the R/B ratio as a proxy
  // for perceptual iridescence (higher blue component = more spectral)
  const accentBlueness = accentRgb[2] / Math.max(accentRgb[0], 0.001);
  const iridescence = Math.min(1, accentBlueness * 0.6);

  // Intensity from surface lightness (lighter surface = more concealed = lower intensity)
  // baseColor is linear, so we use luminance: 0.2126R + 0.7152G + 0.0722B
  const surfaceLuminance = 0.2126 * baseColor[0] + 0.7152 * baseColor[1] + 0.0722 * baseColor[2];
  const intensity = Math.min(1, Math.max(0, 1 - surfaceLuminance * 0.6));

  return {
    u_time:           runtimeOverrides?.u_time           ?? 0,
    u_resolution:     runtimeOverrides?.u_resolution     ?? [1, 1],
    u_pointer:        runtimeOverrides?.u_pointer        ?? [0.5, 0.5],
    u_reducedMotion:  runtimeOverrides?.u_reducedMotion  ?? 0,
    u_intensity:      intensity,
    u_iridescence:    iridescence,
    u_shimmerOpacity: 0.12, // nacre-effect-shimmer-opacity token default
    u_baseColor:      baseColor,
    u_accentColor:    accentRgb,
  };
}
