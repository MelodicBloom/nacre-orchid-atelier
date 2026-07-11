import type { NacreProfile } from '../types/profile.js';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Validates a raw JSON object against the NacreProfile shape.
 * Does not require Zod at runtime — intentionally lightweight
 * so this can run in edge environments.
 *
 * @param input - Raw parsed JSON from a nacre-inquiry-engine output file
 * @returns ValidationResult with valid flag and any error messages
 *
 * @example
 * ```ts
 * import profileJson from './my-profile.json';
 * import { validateProfile } from '@nacre/tokens';
 *
 * const result = validateProfile(profileJson);
 * if (!result.valid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateProfile(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['Profile must be a non-null object'] };
  }

  const obj = input as Record<string, unknown>;

  if (obj['schema_name'] !== 'DeterministicInquiryEngine') {
    errors.push(`schema_name must be "DeterministicInquiryEngine", got: ${String(obj['schema_name'])}`);
  }

  if (typeof obj['version'] !== 'string' || !/^\d+\.\d+\.\d+$/.test(obj['version'])) {
    errors.push('version must be a semver string (e.g. "1.0.0")');
  }

  if (typeof obj['entity'] !== 'object' || obj['entity'] === null) {
    errors.push('entity must be a non-null object');
  } else {
    const entity = obj['entity'] as Record<string, unknown>;
    if (typeof entity['id'] !== 'string') errors.push('entity.id must be a string');
    if (typeof entity['name'] !== 'string') errors.push('entity.name must be a string');
    if (typeof entity['entity_type'] !== 'string') errors.push('entity.entity_type must be a string');
  }

  if (typeof obj['layers'] !== 'object' || obj['layers'] === null) {
    errors.push('layers must be a non-null object');
  } else {
    const layers = obj['layers'] as Record<string, unknown>;

    if (!Array.isArray(layers['semantic_axes'])) {
      errors.push('layers.semantic_axes must be an array');
    } else {
      (layers['semantic_axes'] as unknown[]).forEach((axis, i) => {
        const a = axis as Record<string, unknown>;
        if (typeof a['position'] !== 'number' || a['position'] < 0 || a['position'] > 1) {
          errors.push(`layers.semantic_axes[${i}].position must be a number between 0 and 1`);
        }
        if (typeof a['confidence'] !== 'number' || a['confidence'] < 0 || a['confidence'] > 1) {
          errors.push(`layers.semantic_axes[${i}].confidence must be a number between 0 and 1`);
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Type guard — narrows unknown to NacreProfile after validation */
export function isNacreProfile(input: unknown): input is NacreProfile {
  return validateProfile(input).valid;
}
