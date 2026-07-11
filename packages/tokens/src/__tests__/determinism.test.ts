import { describe, it, expect } from 'vitest';
import { profileToTokens } from '../pipeline/profile-to-tokens.js';
import { isNacreProfile } from '../pipeline/validate-profile.js';
import exampleProfile from '../../fixtures/example-profile.json';

// ── Core determinism contract ──────────────────────────────────────────────────
//
// RULE: profileToTokens(profile, seed) must always return byte-identical
// output for the same (profile, seed) pair, regardless of call order,
// timing, or environment. Any change to this behaviour is a breaking change.

describe('profileToTokens — determinism', () => {
  it('produces identical output across 10 repeated calls with the same seed', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');

    const reference = profileToTokens(exampleProfile, 42);
    for (let i = 0; i < 9; i++) {
      const run = profileToTokens(exampleProfile, 42);
      // Compare all stable fields (exclude generatedAt timestamp)
      expect(run.profileId).toBe(reference.profileId);
      expect(run.seed).toBe(reference.seed);
      expect(run.color.surface).toEqual(reference.color.surface);
      expect(run.color.accent).toEqual(reference.color.accent);
      expect(run.color.text).toEqual(reference.color.text);
      expect(run.color.border).toEqual(reference.color.border);
      expect(run.motion.enter).toEqual(reference.motion.enter);
      expect(run.motion.exit).toEqual(reference.motion.exit);
      expect(run.motion.idle).toEqual(reference.motion.idle);
      expect(run.motion.stress).toEqual(reference.motion.stress);
      expect(run.spacing).toEqual(reference.spacing);
      expect(run.typography).toEqual(reference.typography);
      expect(run.elevation).toEqual(reference.elevation);
    }
  });

  it('produces DIFFERENT output for different seeds', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    // Seeds don't yet affect color math but we verify the seed is stored
    const run42 = profileToTokens(exampleProfile, 42);
    const run99 = profileToTokens(exampleProfile, 99);
    expect(run42.seed).toBe(42);
    expect(run99.seed).toBe(99);
    expect(run42.seed).not.toBe(run99.seed);
  });

  it('stores the seed in the output token set', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile, 777);
    expect(tokens.seed).toBe(777);
  });

  it('defaults to seed 42 when no seed is provided', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile);
    expect(tokens.seed).toBe(42);
  });
});

// ── Token shape contract ───────────────────────────────────────────────────────

describe('profileToTokens — output shape', () => {
  it('maps entity.id to profileId', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile, 42);
    expect(tokens.profileId).toBe('nacre-gate');
  });

  it('maps version to profileVersion', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile, 42);
    expect(tokens.profileVersion).toBe('1.0.0');
  });

  it('emits at least 3 surface color tokens', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile, 42);
    expect(tokens.color.surface.length).toBeGreaterThanOrEqual(3);
  });

  it('emits at least 2 accent color tokens', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile, 42);
    expect(tokens.color.accent.length).toBeGreaterThanOrEqual(2);
  });

  it('all color tokens have valid CSS var names', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile, 42);
    const allTokens = [
      ...tokens.color.surface,
      ...tokens.color.accent,
      ...tokens.color.text,
      ...tokens.color.border,
    ];
    for (const token of allTokens) {
      expect(token.cssVar).toMatch(/^--nacre-color-/);
      expect(token.value).toMatch(/^hsl\(/);
    }
  });

  it('all color tokens reference a sourceAxis', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile, 42);
    const allTokens = [
      ...tokens.color.surface,
      ...tokens.color.accent,
      ...tokens.color.text,
      ...tokens.color.border,
    ];
    for (const token of allTokens) {
      expect(typeof token.sourceAxis).toBe('string');
      expect(token.sourceAxis.length).toBeGreaterThan(0);
    }
  });

  it('motion tokens have positive durations', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile, 42);
    expect(tokens.motion.enter.duration).toBeGreaterThan(0);
    expect(tokens.motion.exit.duration).toBeGreaterThan(0);
    expect(tokens.motion.idle.duration).toBeGreaterThan(0);
    expect(tokens.motion.stress.duration).toBeGreaterThan(0);
  });

  it('motion tokens derive easing from adaptation_style "bloom"', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    // nacre-gate profile uses adaptation_style: "bloom"
    // bloom maps to cubic-bezier(0, 0, 0.2, 1)
    const tokens = profileToTokens(exampleProfile, 42);
    expect(tokens.motion.enter.easing).toBe('cubic-bezier(0, 0, 0.2, 1)');
  });

  it('motion tokens derive duration from rhythm_type "bloom" (600ms base)', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    // nacre-gate profile uses rhythm_type: "bloom" which maps to 600ms
    const tokens = profileToTokens(exampleProfile, 42);
    expect(tokens.motion.enter.duration).toBe(600);  // bloom = 600ms, enter multiplier = 1
    expect(tokens.motion.exit.duration).toBe(450);   // 600 * 0.75
    expect(tokens.motion.stress.duration).toBe(300); // 600 * 0.5
  });

  it('motion tokens have valid CSS var names', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile, 42);
    expect(tokens.motion.enter.cssVar).toBe('--nacre-motion-enter-duration');
    expect(tokens.motion.exit.cssVar).toBe('--nacre-motion-exit-duration');
    expect(tokens.motion.idle.cssVar).toBe('--nacre-motion-idle-duration');
    expect(tokens.motion.stress.cssVar).toBe('--nacre-motion-stress-duration');
  });

  it('motion tokens record their source rhythm', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile, 42);
    expect(tokens.motion.enter.sourceRhythm).toBe('bloom');
  });
});

// ── Snapshot regression guard ──────────────────────────────────────────────────
//
// This snapshot captures the full stable output of the nacre-gate profile
// at seed 42. Any change to the snapshot output is a deliberate breaking
// change and must be reviewed and approved before merge.

describe('profileToTokens — snapshot regression', () => {
  it('matches the nacre-gate seed-42 snapshot', () => {
    if (!isNacreProfile(exampleProfile)) throw new Error('Fixture is not a valid NacreProfile');
    const tokens = profileToTokens(exampleProfile, 42);
    // Destructure out generatedAt (non-deterministic timestamp)
    const { generatedAt: _ts, ...stableTokens } = tokens;
    expect(stableTokens).toMatchSnapshot();
  });
});
