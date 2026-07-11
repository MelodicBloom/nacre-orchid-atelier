import type { NacreProfile, SemanticAxis } from '../types/profile.js';
import type { NacreTokenSet, ColorToken, MotionToken } from '../types/tokens.js';
import { TOKEN_DEFAULTS } from '../constants.js';

/**
 * Transforms a validated NacreProfile into a fully typed NacreTokenSet.
 * All pseudo-random values use the provided seed for deterministic output.
 *
 * @param profile - A validated NacreProfile from nacre-inquiry-engine
 * @param seed - Integer seed for deterministic generation (default: 42)
 * @returns NacreTokenSet — the complete token set for this profile
 *
 * @example
 * ```ts
 * import profileJson from './nacre-gate-profile.json';
 * import { profileToTokens, validateProfile } from '@nacre/tokens';
 *
 * if (!validateProfile(profileJson).valid) throw new Error('Invalid profile');
 * const tokens = profileToTokens(profileJson, 42);
 * console.log(tokens.color.surface[0].cssVar); // --nacre-color-surface-0
 * ```
 */
export function profileToTokens(profile: NacreProfile, seed: number = 42): NacreTokenSet {
  const axes = profile.layers.semantic_axes;
  const composition = profile.layers.composition;
  const behavior = profile.layers.behavior;

  return {
    profileId: profile.entity.id,
    profileVersion: profile.version,
    generatedAt: new Date().toISOString(),
    seed,
    color: {
      surface: buildSurfaceColors(axes),
      accent: buildAccentColors(axes),
      text: buildTextColors(axes),
      border: buildBorderColors(axes),
    },
    motion: {
      enter: buildMotionToken('enter', composition?.rhythm_type, behavior?.adaptation_style),
      exit: buildMotionToken('exit', composition?.rhythm_type, behavior?.adaptation_style),
      idle: buildMotionToken('idle', composition?.rhythm_type, behavior?.adaptation_style),
      stress: buildMotionToken('stress', composition?.rhythm_type, behavior?.stress_state != null ? 'harden' : 'adapt'),
    },
    material: [],
    spacing: TOKEN_DEFAULTS.spacing,
    typography: TOKEN_DEFAULTS.typography,
    elevation: TOKEN_DEFAULTS.elevation,
  };
}

// ─── Internal builders ───────────────────────────────────────────────────────

function buildSurfaceColors(axes: readonly SemanticAxis[]): readonly ColorToken[] {
  const warmthAxis = axes.find(a => a.axis_id.includes('warm') || a.axis_id.includes('temperature'));
  const luminosityAxis = axes.find(a => a.axis_id.includes('light') || a.axis_id.includes('luminosity'));

  const hue = warmthAxis ? lerp(200, 340, warmthAxis.position) : 210;
  const lightness = luminosityAxis ? lerp(10, 95, luminosityAxis.position) : 96;

  return [
    { cssVar: '--nacre-color-surface-0', value: `hsl(${hue} 15% ${lightness}%)`, sourceAxis: warmthAxis?.axis_id ?? 'default' },
    { cssVar: '--nacre-color-surface-1', value: `hsl(${hue} 20% ${Math.max(lightness - 6, 5)}%)`, sourceAxis: warmthAxis?.axis_id ?? 'default' },
    { cssVar: '--nacre-color-surface-2', value: `hsl(${hue} 25% ${Math.max(lightness - 12, 5)}%)`, sourceAxis: warmthAxis?.axis_id ?? 'default' },
  ];
}

function buildAccentColors(axes: readonly SemanticAxis[]): readonly ColorToken[] {
  const vibrancyAxis = axes.find(a => a.axis_id.includes('vibrant') || a.axis_id.includes('saturated'));
  const saturation = vibrancyAxis ? lerp(20, 90, vibrancyAxis.position) : 60;

  return [
    { cssVar: '--nacre-color-accent-primary', value: `hsl(290 ${saturation}% 55%)`, sourceAxis: vibrancyAxis?.axis_id ?? 'default' },
    { cssVar: '--nacre-color-accent-secondary', value: `hsl(180 ${saturation * 0.7}% 50%)`, sourceAxis: vibrancyAxis?.axis_id ?? 'default' },
  ];
}

function buildTextColors(axes: readonly SemanticAxis[]): readonly ColorToken[] {
  return [
    { cssVar: '--nacre-color-text-primary', value: 'hsl(240 10% 12%)', sourceAxis: 'default' },
    { cssVar: '--nacre-color-text-secondary', value: 'hsl(240 8% 40%)', sourceAxis: 'default' },
    { cssVar: '--nacre-color-text-inverse', value: 'hsl(0 0% 98%)', sourceAxis: 'default' },
  ];
}

function buildBorderColors(axes: readonly SemanticAxis[]): readonly ColorToken[] {
  return [
    { cssVar: '--nacre-color-border-subtle', value: 'hsl(240 10% 88%)', sourceAxis: 'default' },
    { cssVar: '--nacre-color-border-strong', value: 'hsl(240 10% 60%)', sourceAxis: 'default' },
  ];
}

const RHYTHM_DURATION: Record<string, number> = {
  pulse: 200, wave: 400, lattice: 300, path: 500,
  bloom: 600, stutter: 150, drift: 800, cascade: 350,
};

const ADAPTATION_EASING: Record<string, string> = {
  rebound: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  dissolve: 'cubic-bezier(0.4, 0, 0.2, 1)',
  harden: 'cubic-bezier(0.4, 0, 1, 1)',
  bloom: 'cubic-bezier(0, 0, 0.2, 1)',
  ripple: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  fracture: 'steps(4, end)',
  adapt: 'cubic-bezier(0.4, 0, 0.2, 1)',
  freeze: 'steps(1, end)',
  yield: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  expand: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

function buildMotionToken(
  role: 'enter' | 'exit' | 'idle' | 'stress',
  rhythmType?: string,
  adaptationStyle?: string,
): MotionToken {
  const baseDuration = rhythmType ? (RHYTHM_DURATION[rhythmType] ?? 300) : 300;
  const multiplier = role === 'exit' ? 0.75 : role === 'stress' ? 0.5 : 1;
  const easing = adaptationStyle ? (ADAPTATION_EASING[adaptationStyle] ?? ADAPTATION_EASING['adapt']) : ADAPTATION_EASING['adapt'];

  return {
    cssVar: `--nacre-motion-${role}-duration`,
    duration: Math.round(baseDuration * multiplier),
    easing: easing ?? 'cubic-bezier(0.4, 0, 0.2, 1)',
    sourceRhythm: rhythmType ?? 'default',
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}
