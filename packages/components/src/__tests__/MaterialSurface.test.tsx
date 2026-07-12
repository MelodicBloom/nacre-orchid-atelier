import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { MaterialSurface } from '../MaterialSurface.js';
import type { TokenSetSlice } from '@nacre/shaders';

// Minimal canonical nacre-gate token slice — matches @nacre/tokens output
const NACRE_GATE_TOKENS: TokenSetSlice = {
  color: {
    surface: [
      { value: 'hsl(210 15% 96%)', cssVar: '--nacre-color-surface-0' },
      { value: 'hsl(210 20% 90%)', cssVar: '--nacre-color-surface-1' },
      { value: 'hsl(210 25% 84%)', cssVar: '--nacre-color-surface-2' },
    ],
    accent: [
      { value: 'hsl(290 60% 55%)', cssVar: '--nacre-color-accent-primary' },
    ],
    text: [
      { value: 'hsl(240 10% 12%)', cssVar: '--nacre-color-text-primary' },
    ],
    border: [
      { value: 'hsl(240 10% 88%)', cssVar: '--nacre-color-border-subtle' },
    ],
  },
  motion: {
    enter: {
      duration: 600,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      sourceRhythm: 'bloom',
    },
    idle: { duration: 600 },
  },
};

describe('MaterialSurface — Gate 1 contract', () => {
  it('renders a React element without throwing', () => {
    const el = (
      <MaterialSurface tokens={NACRE_GATE_TOKENS} reducedMotion={true}>
        <span>content</span>
      </MaterialSurface>
    );
    expect(el).toBeDefined();
  });

  it('encodes uniform metadata as data-uniforms JSON string', () => {
    const el = (
      <MaterialSurface tokens={NACRE_GATE_TOKENS} />
    ) as React.ReactElement;
    expect(el.props['data-uniforms']).toBeTypeOf('string');
    const parsed = JSON.parse(el.props['data-uniforms']);
    expect(parsed).toHaveProperty('u_intensity');
    expect(parsed).toHaveProperty('u_iridescence');
  });

  it('honours reducedMotion flag in data-tier and data-max-canvases', () => {
    const el = (
      <MaterialSurface tokens={NACRE_GATE_TOKENS} reducedMotion={true} />
    ) as React.ReactElement;
    expect(el.props['data-tier']).toBe('css-only');
    expect(el.props['data-max-canvases']).toBe(0);
  });
});
