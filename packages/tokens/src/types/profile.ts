/**
 * TypeScript types derived from the nacre-inquiry-engine
 * deterministic-inquiry.schema.json (v1.x).
 *
 * These types are the single source of truth for how
 * inquiry profiles flow into the token pipeline.
 *
 * @see https://github.com/MelodicBloom/nacre-inquiry-engine/blob/main/deterministic-inquiry.schema.json
 */

export type EntityType =
  | 'system' | 'scene' | 'component' | 'material'
  | 'brand' | 'interaction' | 'artifact' | 'experience' | 'concept';

export type ScopeType = 'concept' | 'prototype' | 'production' | 'speculative';

export type AdaptationStyle =
  | 'rebound' | 'dissolve' | 'harden' | 'bloom' | 'ripple'
  | 'fracture' | 'adapt' | 'freeze' | 'yield' | 'expand';

export type SymmetryType = 'radial' | 'bilateral' | 'asymmetric' | 'modular' | 'fractal' | 'layered';

export type ContrastStyle = 'scale' | 'texture' | 'light' | 'density' | 'temperature' | 'silence' | 'motion' | 'color';

export type RhythmType = 'pulse' | 'wave' | 'lattice' | 'path' | 'bloom' | 'stutter' | 'drift' | 'cascade';

export interface SemanticAxis {
  readonly axis_id: string;
  readonly left_pole: string;
  readonly right_pole: string;
  /** 0 = left pole, 1 = right pole, 0.5 = neutral */
  readonly position: number;
  readonly confidence: number;
  readonly evidence?: readonly string[];
  readonly notes?: string;
}

export interface BehaviorState {
  readonly idle_state?: string;
  readonly responsive_state?: string;
  readonly stress_state?: string;
  readonly recovery_state?: string;
  readonly adaptation_style?: AdaptationStyle;
}

export interface NacreProfileEssence {
  readonly core_metaphor: string;
  readonly governing_noun?: string;
  readonly governing_verb: string;
  readonly felt_center?: string;
  readonly one_sentence_thesis: string;
}

export interface NacreProfileComposition {
  readonly symmetry_type?: SymmetryType;
  readonly dominant_structure?: string;
  readonly contrast_style?: ContrastStyle;
  readonly rhythm_type?: RhythmType;
  readonly hierarchy_logic?: string;
}

export interface NacreProfileImplementation {
  readonly token_domains?: readonly string[];
  readonly component_implications?: readonly string[];
  readonly interaction_rules?: readonly string[];
  readonly rendering_constraints?: readonly string[];
  readonly documentation_required?: readonly string[];
}

export interface NacreProfile {
  readonly schema_name: 'DeterministicInquiryEngine';
  readonly version: string;
  readonly entity: {
    readonly id: string;
    readonly name: string;
    readonly entity_type: EntityType;
    readonly scope?: ScopeType;
    readonly description?: string;
  };
  readonly layers: {
    readonly essence: NacreProfileEssence;
    readonly semantic_axes: readonly SemanticAxis[];
    readonly negative_definition?: {
      readonly is_not?: readonly string[];
      readonly rejects?: readonly string[];
      readonly anti_examples?: readonly string[];
      readonly failure_modes?: readonly string[];
    };
    readonly behavior?: BehaviorState;
    readonly symbolism?: {
      readonly archetype?: string;
      readonly lore_role?: string;
      readonly material_associations?: readonly string[];
      readonly symbolic_pairs?: readonly string[];
      readonly cultural_resonances?: readonly string[];
    };
    readonly composition?: NacreProfileComposition;
    readonly relationships?: {
      readonly allies?: readonly string[];
      readonly opposites?: readonly string[];
      readonly dependencies?: readonly string[];
      readonly bridges?: readonly string[];
      readonly container_system?: string;
    };
    readonly implementation_translation?: NacreProfileImplementation;
  };
  readonly metadata?: {
    readonly created_at?: string;
    readonly author?: string;
    readonly session_id?: string;
    readonly inquiry_version?: string;
    readonly tags?: readonly string[];
  };
}
