/**
 * Token output types produced by the nacre token pipeline.
 * Every value in NacreTokenSet traces back to a SemanticAxis
 * position or a composition property from the inquiry profile.
 */

export interface ColorToken {
  /** CSS custom property name, e.g. `--nacre-color-surface-primary` */
  readonly cssVar: string;
  /** Resolved HSL value */
  readonly value: string;
  /** Source axis_id that drove this token's value */
  readonly sourceAxis: string;
}

export interface MotionToken {
  readonly cssVar: string;
  /** Duration in milliseconds */
  readonly duration: number;
  /** CSS easing function */
  readonly easing: string;
  /** RhythmType that sourced this token */
  readonly sourceRhythm: string;
}

export interface MaterialToken {
  readonly cssVar: string;
  /** Reference to a shader in @nacre/shaders */
  readonly shaderRef: string;
  /** Performance tier required by this material */
  readonly performanceTier: 'low' | 'mid' | 'high';
  /** Uniform overrides driven by axis positions */
  readonly uniformOverrides: Record<string, number>;
}

export interface NacreTokenSet {
  readonly profileId: string;
  readonly profileVersion: string;
  readonly generatedAt: string;
  readonly seed: number;
  readonly color: {
    readonly surface: readonly ColorToken[];
    readonly accent: readonly ColorToken[];
    readonly text: readonly ColorToken[];
    readonly border: readonly ColorToken[];
  };
  readonly motion: {
    readonly enter: MotionToken;
    readonly exit: MotionToken;
    readonly idle: MotionToken;
    readonly stress: MotionToken;
  };
  readonly material: readonly MaterialToken[];
  readonly spacing: Record<string, string>;
  readonly typography: Record<string, string>;
  readonly elevation: Record<string, string>;
}
