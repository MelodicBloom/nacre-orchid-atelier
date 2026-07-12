import { describe, it, expect } from 'vitest';
import { nacrePearlBloom, NACRE_PEARL_BLOOM_DEFAULTS } from '../presets/nacre-pearl-bloom.js';
import meta from '../presets/nacre-pearl-bloom.meta.json';

describe('nacre-pearl-bloom preset descriptor', () => {
  it('has stable id "nacre-pearl-bloom"', () => {
    expect(nacrePearlBloom.id).toBe('nacre-pearl-bloom');
  });

  it('family is "nacre"', () => {
    expect(nacrePearlBloom.family).toBe('nacre');
  });

  it('tier is "webgl2"', () => {
    expect(nacrePearlBloom.tier).toBe('webgl2');
  });

  it('fallbackTier is "css"', () => {
    expect(nacrePearlBloom.fallbackTier).toBe('css');
  });

  it('contextBudget is 1', () => {
    expect(nacrePearlBloom.contextBudget).toBe(1);
  });

  it('defaults match NACRE_PEARL_BLOOM_DEFAULTS', () => {
    expect(nacrePearlBloom.defaults).toEqual(NACRE_PEARL_BLOOM_DEFAULTS);
  });
});

describe('nacre-pearl-bloom.meta.json contract', () => {
  it('has all required uniform keys declared', () => {
    const requiredUniforms = [
      'u_time', 'u_resolution', 'u_pointer', 'u_intensity',
      'u_iridescence', 'u_shimmerOpacity', 'u_baseColor',
      'u_accentColor', 'u_reducedMotion',
    ];
    for (const key of requiredUniforms) {
      expect(meta.uniforms).toHaveProperty(key);
    }
  });

  it('all uniforms have a type and default', () => {
    for (const [name, def] of Object.entries(meta.uniforms as Record<string, Record<string, unknown>>)) {
      expect(def, `uniform ${name} missing type`).toHaveProperty('type');
      expect(def, `uniform ${name} missing default`).toHaveProperty('default');
    }
  });

  it('sourceProfile is "nacre-gate"', () => {
    expect(meta.sourceProfile).toBe('nacre-gate');
  });

  it('motionBasis.baseDurationMs is 600 (bloom rhythm)', () => {
    expect((meta.motionBasis as Record<string, unknown>).baseDurationMs).toBe(600);
  });

  it('motionBasis.easing is the bloom cubic-bezier', () => {
    expect((meta.motionBasis as Record<string, unknown>).easing).toBe('cubic-bezier(0, 0, 0.2, 1)');
  });

  it('failureModes array is non-empty', () => {
    expect(Array.isArray(meta.failureModes)).toBe(true);
    expect((meta.failureModes as unknown[]).length).toBeGreaterThan(0);
  });
});

describe('NACRE_PEARL_BLOOM_DEFAULTS', () => {
  it('u_reducedMotion defaults to 0', () => {
    expect(NACRE_PEARL_BLOOM_DEFAULTS.u_reducedMotion).toBe(0);
  });

  it('u_pointer defaults to centre [0.5, 0.5]', () => {
    expect(NACRE_PEARL_BLOOM_DEFAULTS.u_pointer).toEqual([0.5, 0.5]);
  });

  it('u_shimmerOpacity matches meta default (0.12)', () => {
    const metaDefault = (meta.uniforms as Record<string, { default: number }>)['u_shimmerOpacity'].default;
    expect(NACRE_PEARL_BLOOM_DEFAULTS.u_shimmerOpacity).toBe(metaDefault);
  });

  it('u_intensity matches meta default (0.72)', () => {
    const metaDefault = (meta.uniforms as Record<string, { default: number }>)['u_intensity'].default;
    expect(NACRE_PEARL_BLOOM_DEFAULTS.u_intensity).toBe(metaDefault);
  });
});
