import { describe, it, expect } from 'vitest';
import { validateProfile, isNacreProfile } from '../pipeline/validate-profile.js';
import { profileToTokens } from '../pipeline/profile-to-tokens.js';
import exampleProfile from '../../fixtures/example-profile.json';

// ── Full pipeline integration ──────────────────────────────────────────────────
//
// Tests the complete path:
//   raw JSON fixture  →  validateProfile  →  profileToTokens  →  NacreTokenSet
//
// This is the Gate 1 integration test. When this passes, the pipeline
// is confirmed to fire end-to-end from inquiry profile to token output.

describe('Pipeline integration — Gate 1', () => {
  it('GATE 1: full pipeline fires from fixture JSON to NacreTokenSet', () => {
    // Step 1: validate
    const validation = validateProfile(exampleProfile);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    // Step 2: narrow type
    expect(isNacreProfile(exampleProfile)).toBe(true);
    if (!isNacreProfile(exampleProfile)) throw new Error('Type guard failed');

    // Step 3: transform to tokens
    const tokens = profileToTokens(exampleProfile, 42);

    // Step 4: assert complete token set
    expect(tokens.profileId).toBe('nacre-gate');
    expect(tokens.profileVersion).toBe('1.0.0');
    expect(tokens.seed).toBe(42);
    expect(typeof tokens.generatedAt).toBe('string');

    // Colors
    expect(tokens.color.surface.length).toBeGreaterThan(0);
    expect(tokens.color.accent.length).toBeGreaterThan(0);
    expect(tokens.color.text.length).toBeGreaterThan(0);
    expect(tokens.color.border.length).toBeGreaterThan(0);

    // Motion
    expect(tokens.motion.enter.duration).toBeGreaterThan(0);
    expect(tokens.motion.enter.easing).toBeTruthy();
    expect(tokens.motion.exit.duration).toBeGreaterThan(0);

    // Spacing / Typography / Elevation defaults present
    expect(Object.keys(tokens.spacing).length).toBeGreaterThan(0);
    expect(Object.keys(tokens.typography).length).toBeGreaterThan(0);
    expect(Object.keys(tokens.elevation).length).toBeGreaterThan(0);
  });

  it('GATE 1: pipeline is pure — identical inputs yield identical stable outputs', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Type guard failed');

    const run1 = profileToTokens(exampleProfile, 42);
    const run2 = profileToTokens(exampleProfile, 42);

    expect(run1.color).toEqual(run2.color);
    expect(run1.motion).toEqual(run2.motion);
    expect(run1.spacing).toEqual(run2.spacing);
  });

  it('GATE 1: profile metadata is preserved in token output', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Type guard failed');
    const tokens = profileToTokens(exampleProfile, 42);
    expect(tokens.profileId).toBe(exampleProfile.entity.id);
    expect(tokens.profileVersion).toBe(exampleProfile.version);
  });

  it('GATE 1: all color CSS vars follow nacre naming convention', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Type guard failed');
    const tokens = profileToTokens(exampleProfile, 42);
    const allColors = [
      ...tokens.color.surface,
      ...tokens.color.accent,
      ...tokens.color.text,
      ...tokens.color.border,
    ];
    for (const t of allColors) {
      expect(t.cssVar).toMatch(/^--nacre-/);
      expect(t.value).toMatch(/^hsl\(/);
    }
  });

  it('GATE 1: motion tokens derive from nacre-gate profile rhythm (bloom = 600ms)', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Type guard failed');
    const tokens = profileToTokens(exampleProfile, 42);
    // bloom rhythm = 600ms base, enter multiplier = 1x
    expect(tokens.motion.enter.duration).toBe(600);
    // bloom adaptation = cubic-bezier(0, 0, 0.2, 1)
    expect(tokens.motion.enter.easing).toBe('cubic-bezier(0, 0, 0.2, 1)');
  });
});

// ── Edge case profiles ─────────────────────────────────────────────────────────

describe('Pipeline integration — edge cases', () => {
  it('handles profile with no composition (uses defaults)', () => {
    const sparse = {
      ...exampleProfile,
      layers: {
        ...exampleProfile.layers,
        composition: undefined,
        behavior: undefined,
      },
    };
    if (!isNacreProfile(sparse)) throw new Error('Type guard failed');
    const tokens = profileToTokens(sparse, 42);
    // Should not throw — defaults kick in
    expect(tokens.motion.enter.duration).toBe(300); // default fallback
    expect(tokens.motion.enter.sourceRhythm).toBe('default');
  });

  it('handles empty semantic_axes array (uses defaults)', () => {
    const noAxes = {
      ...exampleProfile,
      layers: {
        ...exampleProfile.layers,
        semantic_axes: [],
      },
    };
    if (!isNacreProfile(noAxes)) throw new Error('Type guard failed');
    const tokens = profileToTokens(noAxes, 42);
    // Surface colors should still be produced with defaults
    expect(tokens.color.surface.length).toBeGreaterThan(0);
  });

  it('pipeline does not mutate the input profile', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Type guard failed');
    const frozen = Object.freeze({ ...exampleProfile });
    expect(() => profileToTokens(frozen, 42)).not.toThrow();
  });
});
