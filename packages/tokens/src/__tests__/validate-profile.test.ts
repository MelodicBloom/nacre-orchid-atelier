import { describe, it, expect } from 'vitest';
import { validateProfile, isNacreProfile } from '../pipeline/validate-profile.js';
import exampleProfile from '../../fixtures/example-profile.json';

// ── Valid profile tests ────────────────────────────────────────────────────────

describe('validateProfile — valid input', () => {
  it('accepts the canonical nacre-gate example profile', () => {
    const result = validateProfile(exampleProfile);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts a minimal valid profile', () => {
    const minimal = {
      schema_name: 'DeterministicInquiryEngine',
      version: '1.0.0',
      entity: { id: 'test', name: 'Test', entity_type: 'concept' },
      layers: {
        essence: {
          core_metaphor: 'a still pool',
          governing_verb: 'reflect',
          one_sentence_thesis: 'A test entity.',
        },
        semantic_axes: [
          { axis_id: 'a', left_pole: 'left', right_pole: 'right', position: 0.5, confidence: 1.0 },
        ],
        negative_definition: {},
        behavior: {},
        symbolism: {},
        composition: {},
        relationships: {},
        implementation_translation: {},
      },
    };
    const result = validateProfile(minimal);
    expect(result.valid).toBe(true);
  });
});

// ── Invalid profile tests ──────────────────────────────────────────────────────

describe('validateProfile — invalid input', () => {
  it('rejects null', () => {
    const result = validateProfile(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/non-null object/);
  });

  it('rejects wrong schema_name', () => {
    const bad = { ...exampleProfile, schema_name: 'WrongSchema' };
    const result = validateProfile(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('schema_name'))).toBe(true);
  });

  it('rejects invalid semver version', () => {
    const bad = { ...exampleProfile, version: 'not-semver' };
    const result = validateProfile(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('version'))).toBe(true);
  });

  it('rejects axis position out of range', () => {
    const bad = {
      ...exampleProfile,
      layers: {
        ...exampleProfile.layers,
        semantic_axes: [
          { axis_id: 'test', left_pole: 'a', right_pole: 'b', position: 1.5, confidence: 0.5 },
        ],
      },
    };
    const result = validateProfile(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('position'))).toBe(true);
  });

  it('rejects axis confidence out of range', () => {
    const bad = {
      ...exampleProfile,
      layers: {
        ...exampleProfile.layers,
        semantic_axes: [
          { axis_id: 'test', left_pole: 'a', right_pole: 'b', position: 0.5, confidence: -0.1 },
        ],
      },
    };
    const result = validateProfile(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('confidence'))).toBe(true);
  });

  it('rejects missing layers', () => {
    const { layers: _layers, ...bad } = exampleProfile as Record<string, unknown>;
    const result = validateProfile(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('layers'))).toBe(true);
  });

  it('rejects missing entity', () => {
    const { entity: _entity, ...bad } = exampleProfile as Record<string, unknown>;
    const result = validateProfile(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('entity'))).toBe(true);
  });
});

// ── Type guard tests ───────────────────────────────────────────────────────────

describe('isNacreProfile type guard', () => {
  it('returns true for valid profile', () => {
    expect(isNacreProfile(exampleProfile)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isNacreProfile(null)).toBe(false);
  });

  it('returns false for plain string', () => {
    expect(isNacreProfile('not a profile')).toBe(false);
  });
});
