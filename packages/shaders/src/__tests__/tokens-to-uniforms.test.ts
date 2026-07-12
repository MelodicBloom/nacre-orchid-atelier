import { describe, it, expect } from 'vitest';
import { tokensToNacrePearlBloomUniforms } from '../uniforms/tokens-to-uniforms.js';
import type { TokenSetSlice } from '../uniforms/tokens-to-uniforms.js';

// ── Canonical nacre-gate token slice ────────────────────────────────────────────────
// These values match what profileToTokens(nacre-gate, 42) emits
// from the @nacre/tokens pipeline.
const NACRE_GATE_TOKENS: TokenSetSlice = {
  color: {
    surface: [
      { value: 'hsl(210 15% 96%)', cssVar: '--nacre-color-surface-0' },
      { value: 'hsl(210 20% 90%)', cssVar: '--nacre-color-surface-1' },
      { value: 'hsl(210 25% 84%)', cssVar: '--nacre-color-surface-2' },
    ],
    accent: [
      { value: 'hsl(290 60% 55%)', cssVar: '--nacre-color-accent-primary' },
      { value: 'hsl(180 42% 50%)', cssVar: '--nacre-color-accent-secondary' },
    ],
    text: [
      { value: 'hsl(240 10% 12%)', cssVar: '--nacre-color-text-primary' },
    ],
    border: [
      { value: 'hsl(240 10% 88%)', cssVar: '--nacre-color-border-subtle' },
    ],
  },
  motion: {
    enter: { duration: 600, easing: 'cubic-bezier(0, 0, 0.2, 1)', sourceRhythm: 'bloom' },
    idle:  { duration: 600 },
  },
};

describe('tokensToNacrePearlBloomUniforms — determinism', () => {
  it('is pure: same input always returns structurally identical output', () => {
    const a = tokensToNacrePearlBloomUniforms(NACRE_GATE_TOKENS);
    const b = tokensToNacrePearlBloomUniforms(NACRE_GATE_TOKENS);
    expect(a).toEqual(b);
  });

  it('produces identical output across 10 calls', () => {
    const ref = tokensToNacrePearlBloomUniforms(NACRE_GATE_TOKENS);
    for (let i = 0; i < 9; i++) {
      expect(tokensToNacrePearlBloomUniforms(NACRE_GATE_TOKENS)).toEqual(ref);
    }
  });
});

describe('tokensToNacrePearlBloomUniforms — output shape', () => {
  const uniforms = tokensToNacrePearlBloomUniforms(NACRE_GATE_TOKENS);

  it('all required BaseUniforms keys are present', () => {
    expect(typeof uniforms.u_time).toBe('number');
    expect(Array.isArray(uniforms.u_resolution)).toBe(true);
    expect(uniforms.u_resolution).toHaveLength(2);
    expect(Array.isArray(uniforms.u_pointer)).toBe(true);
    expect(uniforms.u_pointer).toHaveLength(2);
    expect(typeof uniforms.u_reducedMotion).toBe('number');
  });

  it('u_intensity is in [0, 1]', () => {
    expect(uniforms.u_intensity).toBeGreaterThanOrEqual(0);
    expect(uniforms.u_intensity).toBeLessThanOrEqual(1);
  });

  it('u_iridescence is in [0, 1]', () => {
    expect(uniforms.u_iridescence).toBeGreaterThanOrEqual(0);
    expect(uniforms.u_iridescence).toBeLessThanOrEqual(1);
  });

  it('u_shimmerOpacity is 0.12 (token default)', () => {
    expect(uniforms.u_shimmerOpacity).toBe(0.12);
  });

  it('u_baseColor is a length-3 tuple with values in [0, 1]', () => {
    expect(uniforms.u_baseColor).toHaveLength(3);
    for (const c of uniforms.u_baseColor) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });

  it('u_accentColor is a length-3 tuple with values in [0, 1]', () => {
    expect(uniforms.u_accentColor).toHaveLength(3);
    for (const c of uniforms.u_accentColor) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });

  it('u_reducedMotion defaults to 0', () => {
    expect(uniforms.u_reducedMotion).toBe(0);
  });

  it('u_time defaults to 0', () => {
    expect(uniforms.u_time).toBe(0);
  });
});

describe('tokensToNacrePearlBloomUniforms — runtime overrides', () => {
  it('applies u_reducedMotion override', () => {
    const u = tokensToNacrePearlBloomUniforms(NACRE_GATE_TOKENS, { u_reducedMotion: 1 });
    expect(u.u_reducedMotion).toBe(1);
  });

  it('applies u_resolution override', () => {
    const u = tokensToNacrePearlBloomUniforms(NACRE_GATE_TOKENS, { u_resolution: [1920, 1080] });
    expect(u.u_resolution).toEqual([1920, 1080]);
  });

  it('applies u_pointer override', () => {
    const u = tokensToNacrePearlBloomUniforms(NACRE_GATE_TOKENS, { u_pointer: [0.2, 0.8] });
    expect(u.u_pointer).toEqual([0.2, 0.8]);
  });

  it('runtime overrides do not affect token-derived values', () => {
    const base = tokensToNacrePearlBloomUniforms(NACRE_GATE_TOKENS);
    const withOverride = tokensToNacrePearlBloomUniforms(NACRE_GATE_TOKENS, { u_time: 99 });
    expect(withOverride.u_intensity).toBe(base.u_intensity);
    expect(withOverride.u_iridescence).toBe(base.u_iridescence);
    expect(withOverride.u_baseColor).toEqual(base.u_baseColor);
  });
});

describe('tokensToNacrePearlBloomUniforms — surface lightness drives intensity', () => {
  it('bright surface (high lightness) produces lower intensity', () => {
    const bright: TokenSetSlice = {
      ...NACRE_GATE_TOKENS,
      color: {
        ...NACRE_GATE_TOKENS.color,
        surface: [{ value: 'hsl(210 15% 98%)', cssVar: '--nacre-color-surface-0' }],
      },
    };
    const dark: TokenSetSlice = {
      ...NACRE_GATE_TOKENS,
      color: {
        ...NACRE_GATE_TOKENS.color,
        surface: [{ value: 'hsl(210 15% 20%)', cssVar: '--nacre-color-surface-0' }],
      },
    };
    const brightU = tokensToNacrePearlBloomUniforms(bright);
    const darkU   = tokensToNacrePearlBloomUniforms(dark);
    expect(brightU.u_intensity).toBeLessThan(darkU.u_intensity);
  });
});

describe('tokensToNacrePearlBloomUniforms — snapshot regression', () => {
  it('matches nacre-gate token slice snapshot', () => {
    const u = tokensToNacrePearlBloomUniforms(NACRE_GATE_TOKENS);
    // Exclude runtime-only fields from snapshot
    const { u_time: _t, u_resolution: _r, u_pointer: _p, ...stable } = u;
    expect(stable).toMatchSnapshot();
  });
});
