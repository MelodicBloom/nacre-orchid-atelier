/**
 * MaterialSurface.tsx
 *
 * React material surface wrapper for the nacre-pearl-bloom shader preset.
 *
 * Responsibilities:
 *   - Read a NacreTokenSet (or compatible slice)
 *   - Map tokens -> nacre-pearl-bloom uniforms via @nacre/shaders
 *   - Detect WebGL capability and reduced-motion preference
 *   - Choose between live shader tier and CSS gradient fallback
 *   - Expose uniform metadata for AETHER ShaderCanvas to consume later
 */

import * as React from 'react';
import type { ReactNode } from 'react';
import {
  nacrePearlBloom,
  tokensToNacrePearlBloomUniforms,
  pearlBloomFallbackStyle,
  detectShaderCapability,
  resolveQualityProfile,
  type TokenSetSlice,
  type NacrePearlBloomUniforms,
} from '@nacre/shaders';

export interface MaterialSurfaceProps {
  /** Token slice for the nacre-gate profile, from @nacre/tokens. */
  readonly tokens: TokenSetSlice;
  /** Pointer position [0-1, 0-1]. Defaults to [0.5, 0.5] (center). */
  readonly pointer?: readonly [number, number];
  /** Canvas resolution [width, height]. Defaults to [800, 600]. */
  readonly resolution?: readonly [number, number];
  /** When true, forces CSS fallback and freezes all motion. */
  readonly reducedMotion?: boolean;
  /** Optional children rendered inside the material surface. */
  readonly children?: ReactNode;
}

export const MaterialSurface: React.FC<MaterialSurfaceProps> = (
  props,
) => {
  const capability = detectShaderCapability();
  const quality = resolveQualityProfile(
    capability,
    Boolean(props.reducedMotion),
  );

  const uniforms: NacrePearlBloomUniforms = React.useMemo(
    () =>
      tokensToNacrePearlBloomUniforms(props.tokens, {
        u_pointer: props.pointer ?? [0.5, 0.5],
        u_resolution: props.resolution ?? [800, 600],
        u_reducedMotion: props.reducedMotion ? 1 : 0,
      }),
    [props.tokens, props.pointer, props.resolution, props.reducedMotion],
  );

  const style = pearlBloomFallbackStyle(uniforms, {
    preferCssVars: true,
    pointer: props.pointer ?? uniforms.u_pointer,
  });

  // Gate 1: even when WebGL tiers are available, we still render the CSS
  // material surface. Live WebGL canvas integration is a separate layer
  // (AETHER ShaderCanvas) that will consume the uniform metadata.

  const dataUniforms = JSON.stringify({
    u_intensity: uniforms.u_intensity,
    u_iridescence: uniforms.u_iridescence,
    u_shimmerOpacity: uniforms.u_shimmerOpacity,
    u_baseColor: uniforms.u_baseColor,
    u_accentColor: uniforms.u_accentColor,
  });

  return (
    <div
      style={style}
      data-preset={nacrePearlBloom.id}
      data-tier={quality.tier}
      data-max-canvases={quality.maxActiveCanvases}
      data-uniforms={dataUniforms}
    >
      {props.children}
    </div>
  );
};
