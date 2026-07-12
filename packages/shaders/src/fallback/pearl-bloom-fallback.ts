/**
 * pearl-bloom-fallback.ts
 *
 * Generates a CSS gradient string that approximates the nacre-pearl-bloom
 * shader's idle visual — used when:
 *   - WebGL is unavailable (capability.tier === 'css')
 *   - prefers-reduced-motion is active
 *   - Gallery card thumbnails (never instantiate a live WebGL context here)
 *
 * The CSS output references the generated nacre token CSS vars wherever
 * possible so the fallback stays consistent with the live token pipeline.
 *
 * RULE: This function is pure. Same inputs always yield the same CSS string.
 */

import type { NacrePearlBloomUniforms } from '../shader-types.js';

export interface PearlBloomFallbackOptions {
  /** Use CSS var references instead of computed values where possible. */
  readonly preferCssVars?: boolean;
  /** Pointer position [0-1] — shifts gradient origin for static shimmer. */
  readonly pointer?: readonly [number, number];
}

/**
 * Returns a CSS `background` shorthand value (not a full rule) that
 * approximates the pearl bloom idle state.
 *
 * Example output:
 *   "radial-gradient(ellipse 120% 80% at 50% 40%,
 *     hsl(200 20% 96%) 0%, hsl(290 55% 62% / 0.08) 50%, hsl(200 20% 90%) 100%)"
 */
export function pearlBloomFallbackCss(
  uniforms: Readonly<NacrePearlBloomUniforms>,
  opts: PearlBloomFallbackOptions = {},
): string {
  const { preferCssVars = true, pointer = uniforms.u_pointer } = opts;
  const px = Math.round(pointer[0] * 100);
  const py = Math.round(pointer[1] * 100);

  const surface = preferCssVars
    ? 'var(--nacre-color-surface-0)'
    : rgbToHsl(uniforms.u_baseColor);
  const accent = preferCssVars
    ? 'var(--nacre-color-material-orchid)'
    : rgbToHsl(uniforms.u_accentColor);
  const surface1 = preferCssVars
    ? 'var(--nacre-color-surface-1)'
    : rgbToHsl(uniforms.u_baseColor, -0.04);

  const accentOpacity = (uniforms.u_shimmerOpacity * 0.7).toFixed(2);

  // Radial gradient from pointer origin, with subtle iridescent tint
  return [
    `radial-gradient(ellipse 140% 100% at ${px}% ${py}%,`,
    `  ${surface} 0%,`,
    `  ${accent} / ${accentOpacity}) 45%,`,
    `  ${surface1} 100%)`,
  ].join('\n');
}

/**
 * Returns the full CSS object for a MaterialSurface fallback:
 * background + transition so the static surface still feels resolved.
 */
export function pearlBloomFallbackStyle(
  uniforms: Readonly<NacrePearlBloomUniforms>,
  opts: PearlBloomFallbackOptions = {},
): Record<string, string> {
  return {
    background: pearlBloomFallbackCss(uniforms, opts),
    transition: 'background var(--nacre-motion-idle-duration, 600ms) var(--nacre-motion-enter-easing, cubic-bezier(0, 0, 0.2, 1))',
    willChange: 'background',
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function rgbToHsl(
  rgb: readonly [number, number, number],
  lightnessOffset = 0,
): string {
  // linear RGB -> sRGB
  const toSrgb = (v: number): number =>
    v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.2) - 0.055;
  const r = toSrgb(rgb[0]);
  const g = toSrgb(rgb[1]);
  const b = toSrgb(rgb[2]);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = Math.round(((max + min) / 2) * 100 + lightnessOffset * 100);
  const d = max - min;
  const s = d === 0 ? 0 : Math.round((d / (1 - Math.abs((max + min) - 1))) * 100);

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round((h * 60 + 360) % 360);
  }

  return `hsl(${h} ${s}% ${l}%)`;
}
