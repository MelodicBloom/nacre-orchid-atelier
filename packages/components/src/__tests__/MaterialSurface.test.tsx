import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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
    accent: [{ value: 'hsl(290 60% 55%)', cssVar: '--nacre-color-accent-primary' }],
    text: [{ value: 'hsl(240 10% 12%)', cssVar: '--nacre-color-text-primary' }],
    border: [{ value: 'hsl(240 10% 88%)', cssVar: '--nacre-color-border-subtle' }],
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
    const html = renderToStaticMarkup(<MaterialSurface tokens={NACRE_GATE_TOKENS} />);
    expect(html).toContain('data-uniforms="');
    expect(html).toContain('&quot;u_intensity&quot;');
    expect(html).toContain('&quot;u_iridescence&quot;');
  });

  it('honours reducedMotion flag in data-tier and data-max-canvases', () => {
    const html = renderToStaticMarkup(
      <MaterialSurface tokens={NACRE_GATE_TOKENS} reducedMotion={true} />,
    );
    expect(html).toContain('data-tier="css-only"');
    expect(html).toContain('data-max-canvases="0"');
  });
});
