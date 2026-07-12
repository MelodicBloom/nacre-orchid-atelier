import { describe, it, expect } from 'vitest';
import { pearlBloomFallbackCss, pearlBloomFallbackStyle } from '../fallback/pearl-bloom-fallback.js';
import { NACRE_PEARL_BLOOM_DEFAULTS } from '../presets/nacre-pearl-bloom.js';

describe('pearlBloomFallbackCss', () => {
  it('returns a non-empty string', () => {
    const css = pearlBloomFallbackCss(NACRE_PEARL_BLOOM_DEFAULTS);
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains radial-gradient', () => {
    const css = pearlBloomFallbackCss(NACRE_PEARL_BLOOM_DEFAULTS);
    expect(css).toContain('radial-gradient');
  });

  it('uses CSS vars when preferCssVars = true (default)', () => {
    const css = pearlBloomFallbackCss(NACRE_PEARL_BLOOM_DEFAULTS, { preferCssVars: true });
    expect(css).toContain('var(--nacre-');
  });

  it('uses computed hsl values when preferCssVars = false', () => {
    const css = pearlBloomFallbackCss(NACRE_PEARL_BLOOM_DEFAULTS, { preferCssVars: false });
    expect(css).toContain('hsl(');
    expect(css).not.toContain('var(--nacre-');
  });

  it('is pure: same uniforms always return identical CSS', () => {
    const a = pearlBloomFallbackCss(NACRE_PEARL_BLOOM_DEFAULTS);
    const b = pearlBloomFallbackCss(NACRE_PEARL_BLOOM_DEFAULTS);
    expect(a).toBe(b);
  });

  it('pointer position shifts gradient origin', () => {
    const center = pearlBloomFallbackCss(NACRE_PEARL_BLOOM_DEFAULTS, { pointer: [0.5, 0.5] });
    const topLeft = pearlBloomFallbackCss(NACRE_PEARL_BLOOM_DEFAULTS, { pointer: [0.0, 0.0] });
    expect(center).not.toBe(topLeft);
    expect(center).toContain('50% 50%');
    expect(topLeft).toContain('0% 0%');
  });
});

describe('pearlBloomFallbackStyle', () => {
  it('returns an object with background, transition, and willChange keys', () => {
    const style = pearlBloomFallbackStyle(NACRE_PEARL_BLOOM_DEFAULTS);
    expect(typeof style.background).toBe('string');
    expect(typeof style.transition).toBe('string');
    expect(typeof style.willChange).toBe('string');
  });

  it('transition references nacre motion tokens', () => {
    const style = pearlBloomFallbackStyle(NACRE_PEARL_BLOOM_DEFAULTS);
    expect(style.transition).toContain('--nacre-motion-');
  });

  it('willChange is "background"', () => {
    const style = pearlBloomFallbackStyle(NACRE_PEARL_BLOOM_DEFAULTS);
    expect(style.willChange).toBe('background');
  });
});
