/**
 * @nacre/tokens
 *
 * Design token pipeline for NACRE ORCHID ATELIER.
 * Consumes a nacre-inquiry-engine semantic profile and outputs
 * typed JS token constants, CSS custom properties, and a Tailwind config extension.
 *
 * @see https://github.com/MelodicBloom/nacre-inquiry-engine
 */

export type { NacreProfile, SemanticAxis, BehaviorState } from './types/profile.js';
export type { NacreTokenSet, ColorToken, MotionToken, MaterialToken } from './types/tokens.js';
export { profileToTokens } from './pipeline/profile-to-tokens.js';
export { validateProfile } from './pipeline/validate-profile.js';
export { TOKEN_DEFAULTS } from './constants.js';
