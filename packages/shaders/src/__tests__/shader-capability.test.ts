import { describe, it, expect } from 'vitest';
import { detectShaderCapability, bestTier } from '../runtime/shader-capability.js';
import { resolveQualityProfile } from '../runtime/shader-quality-tier.js';

describe('detectShaderCapability — Node environment', () => {
  it('returns css tier in Node (no document)', () => {
    // Vitest runs in Node; document is unavailable unless jsdom is configured
    const result = detectShaderCapability();
    // In Node: always css tier
    expect(result.tier).toBe('css');
    expect(result.webgl2).toBe(false);
    expect(result.webgl1).toBe(false);
    expect(result.reason).toMatch(/Non-browser/);
  });

  it('bestTier returns the tier from capability result', () => {
    const cap = detectShaderCapability();
    expect(bestTier(cap)).toBe(cap.tier);
  });
});

describe('resolveQualityProfile', () => {
  it('returns css-only when reducedMotion is true, regardless of capability', () => {
    const cap = detectShaderCapability(); // css in Node
    const profile = resolveQualityProfile(cap, true);
    expect(profile.tier).toBe('css-only');
    expect(profile.motionMultiplier).toBe(0);
    expect(profile.maxActiveCanvases).toBe(0);
    expect(profile.reason).toMatch(/prefers-reduced-motion/);
  });

  it('returns css-only for css-tier capability without reduced motion', () => {
    const cssCap = {
      tier: 'css' as const,
      webgl2: false,
      webgl1: false,
      highpSupported: false,
      mediumpSupported: false,
      reason: 'No WebGL',
    };
    const profile = resolveQualityProfile(cssCap, false);
    expect(profile.tier).toBe('css-only');
    expect(profile.maxActiveCanvases).toBe(0);
  });

  it('returns high tier for webgl2 + highp', () => {
    const webgl2Cap = {
      tier: 'webgl2' as const,
      webgl2: true,
      webgl1: true,
      highpSupported: true,
      mediumpSupported: true,
      reason: 'WebGL2 with highp float',
    };
    const profile = resolveQualityProfile(webgl2Cap, false);
    expect(profile.tier).toBe('high');
    expect(profile.maxActiveCanvases).toBe(1);
    expect(profile.motionMultiplier).toBe(1.0);
  });

  it('returns medium tier for webgl2 without highp', () => {
    const webgl2NohighpCap = {
      tier: 'webgl2' as const,
      webgl2: true,
      webgl1: true,
      highpSupported: false,
      mediumpSupported: true,
      reason: 'WebGL2 no highp',
    };
    const profile = resolveQualityProfile(webgl2NohighpCap, false);
    expect(profile.tier).toBe('medium');
  });

  it('maxActiveCanvases is always 1 for WebGL tiers — enforces context budget', () => {
    const caps = [
      { tier: 'webgl2' as const, webgl2: true, webgl1: true, highpSupported: true, mediumpSupported: true, reason: '' },
      { tier: 'webgl1' as const, webgl2: false, webgl1: true, highpSupported: true, mediumpSupported: true, reason: '' },
    ];
    for (const cap of caps) {
      const profile = resolveQualityProfile(cap, false);
      expect(profile.maxActiveCanvases).toBe(1);
    }
  });
});
