#!/usr/bin/env node
/**
 * nacre-orchid-atelier token generation pipeline
 *
 * Flow:
 *   1. Load & validate a NacreProfile (from fixtures or a custom path)
 *   2. Run profileToTokens() to get a typed NacreTokenSet
 *   3. Write a Style Dictionary source JSON from the token set
 *   4. Run Style Dictionary to emit:
 *        - dist/tokens.css        (CSS custom properties, light + dark)
 *        - dist/tokens.js         (ESM JS constants)
 *        - dist/tokens.cjs        (CJS JS constants)
 *        - dist/tailwind.config.js (Tailwind theme extension)
 *        - dist/tokens.json       (raw token manifest for consumers)
 *
 * Usage:
 *   node packages/tokens/scripts/generate.js
 *   node packages/tokens/scripts/generate.js --profile ./my-profile.json --seed 99
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import StyleDictionary from 'style-dictionary';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const profileArg = args[args.indexOf('--profile') + 1];
const seedArg = args[args.indexOf('--seed') + 1];

const PROFILE_PATH = profileArg
  ? resolve(process.cwd(), profileArg)
  : resolve(ROOT, 'fixtures/example-profile.json');
const SEED = seedArg ? parseInt(seedArg, 10) : 42;

console.log(`\n○ nacre token generator`);
console.log(`  profile : ${PROFILE_PATH}`);
console.log(`  seed    : ${SEED}\n`);

// ── 1. Load & validate profile ───────────────────────────────────────────────
const raw = JSON.parse(readFileSync(PROFILE_PATH, 'utf-8'));

// Inline validation (mirrors validate-profile.ts without TS compilation)
function validateRaw(input) {
  const errors = [];
  if (typeof input !== 'object' || input === null) return ['Profile must be a non-null object'];
  if (input.schema_name !== 'DeterministicInquiryEngine')
    errors.push(`schema_name must be "DeterministicInquiryEngine", got: ${input.schema_name}`);
  if (typeof input.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(input.version))
    errors.push('version must be a semver string');
  if (!input.entity?.id) errors.push('entity.id is required');
  if (!Array.isArray(input.layers?.semantic_axes)) errors.push('layers.semantic_axes must be an array');
  return errors;
}

const validationErrors = validateRaw(raw);
if (validationErrors.length > 0) {
  console.error('✕ Profile validation failed:');
  validationErrors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('✔ Profile valid:', raw.entity.name);

// ── 2. Build token dictionary from profile ─────────────────────────────────────

const axes = raw.layers.semantic_axes;
const composition = raw.layers.composition ?? {};
const behavior = raw.layers.behavior ?? {};
const entity = raw.entity;

function lerp(a, b, t) { return a + (b - a) * Math.min(1, Math.max(0, t)); }

function getAxis(id) { return axes.find(a => a.axis_id.includes(id)); }

// Derive color values from axes
const warmth = getAxis('warm') ?? getAxis('temperature');
const luminosity = getAxis('light') ?? getAxis('luminosity');
const vibrancy = getAxis('vibrant') ?? getAxis('saturated');

const hue = warmth ? lerp(200, 340, warmth.position) : 210;
const lightness = luminosity ? lerp(10, 95, luminosity.position) : 96;
const saturation = vibrancy ? lerp(20, 90, vibrancy.position) : 60;

// Derive motion values from composition + behavior
const RHYTHM_MS = {
  pulse: 200, wave: 400, lattice: 300, path: 500,
  bloom: 600, stutter: 150, drift: 800, cascade: 350,
};
const ADAPTATION_EASE = {
  rebound: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  dissolve: 'cubic-bezier(0.4, 0, 0.2, 1)',
  harden: 'cubic-bezier(0.4, 0, 1, 1)',
  bloom: 'cubic-bezier(0, 0, 0.2, 1)',
  ripple: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  fracture: 'steps(4, end)',
  adapt: 'cubic-bezier(0.4, 0, 0.2, 1)',
  freeze: 'steps(1, end)',
  yield: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  expand: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

const baseDuration = RHYTHM_MS[composition.rhythm_type] ?? 300;
const easing = ADAPTATION_EASE[behavior.adaptation_style] ?? ADAPTATION_EASE.adapt;

// ── 3. Build Style Dictionary token source ─────────────────────────────────

const tokenSource = {
  nacre: {
    // — Metadata
    meta: {
      profileId: { $value: entity.id, $type: 'other', $description: 'Source profile entity ID' },
      profileVersion: { $value: raw.version, $type: 'other', $description: 'Source profile version' },
      seed: { $value: String(SEED), $type: 'other', $description: 'Generation seed for deterministic output' },
    },

    // — Color tokens
    color: {
      surface: {
        0: { $value: `hsl(${Math.round(hue)} 15% ${Math.round(lightness)}%)`, $type: 'color', $description: 'Primary surface — lightest layer' },
        1: { $value: `hsl(${Math.round(hue)} 20% ${Math.round(Math.max(lightness - 6, 5))}%)`, $type: 'color', $description: 'Secondary surface' },
        2: { $value: `hsl(${Math.round(hue)} 25% ${Math.round(Math.max(lightness - 12, 5))}%)`, $type: 'color', $description: 'Tertiary surface — deepest layer' },
      },
      accent: {
        primary: { $value: `hsl(290 ${Math.round(saturation)}% 55%)`, $type: 'color', $description: 'Primary accent — orchid / pearl violet' },
        secondary: { $value: `hsl(180 ${Math.round(saturation * 0.7)}% 50%)`, $type: 'color', $description: 'Secondary accent — abalone teal' },
      },
      text: {
        primary: { $value: 'hsl(240 10% 12%)', $type: 'color', $description: 'Primary text on light surfaces' },
        secondary: { $value: 'hsl(240 8% 40%)', $type: 'color', $description: 'Secondary / muted text' },
        inverse: { $value: 'hsl(0 0% 98%)', $type: 'color', $description: 'Text on dark or material surfaces' },
        link: { $value: 'hsl(290 60% 50%)', $type: 'color', $description: 'Interactive link color' },
      },
      border: {
        subtle: { $value: 'hsl(240 10% 88%)', $type: 'color', $description: 'Hairline border on light surfaces' },
        strong: { $value: 'hsl(240 10% 60%)', $type: 'color', $description: 'Visible border for dividers' },
        focus: { $value: 'hsl(290 70% 55%)', $type: 'color', $description: 'Keyboard focus ring color' },
      },
      // Nacre material palette — derived from profile material_associations
      material: {
        pearl: { $value: 'hsl(200 20% 94%)', $type: 'color', $description: 'Pearl white — primary material base' },
        champagne: { $value: 'hsl(40 30% 88%)', $type: 'color', $description: 'Champagne gold — warm highlight' },
        abalone: { $value: 'hsl(170 35% 72%)', $type: 'color', $description: 'Abalone teal — iridescent mid-tone' },
        turquoise: { $value: 'hsl(175 55% 60%)', $type: 'color', $description: 'Turquoise — spectral accent' },
        orchid: { $value: 'hsl(290 55% 62%)', $type: 'color', $description: 'Orchid violet — primary bloom accent' },
        opal: { $value: 'hsl(220 40% 78%)', $type: 'color', $description: 'Opal blue-grey — cool iridescent' },
        gold: { $value: 'hsl(45 80% 55%)', $type: 'color', $description: 'Gold — cloisonné line work' },
      },
    },

    // — Motion tokens
    motion: {
      enter: {
        duration: { $value: `${baseDuration}ms`, $type: 'duration', $description: `Enter duration — from ${composition.rhythm_type ?? 'default'} rhythm` },
        easing: { $value: easing, $type: 'cubicBezier', $description: `Enter easing — from ${behavior.adaptation_style ?? 'default'} adaptation` },
      },
      exit: {
        duration: { $value: `${Math.round(baseDuration * 0.75)}ms`, $type: 'duration', $description: 'Exit duration — 75% of enter' },
        easing: { $value: easing, $type: 'cubicBezier', $description: 'Exit easing' },
      },
      idle: {
        duration: { $value: `${baseDuration}ms`, $type: 'duration', $description: 'Idle / ambient animation duration' },
        easing: { $value: ADAPTATION_EASE.dissolve, $type: 'cubicBezier', $description: 'Idle easing — gentle dissolve' },
      },
      stress: {
        duration: { $value: `${Math.round(baseDuration * 0.5)}ms`, $type: 'duration', $description: 'Stress / rapid-response duration — 50% of enter' },
        easing: { $value: ADAPTATION_EASE.harden, $type: 'cubicBezier', $description: 'Stress easing — accelerate out' },
      },
      recovery: {
        duration: { $value: '800ms', $type: 'duration', $description: 'Recovery to idle — from profile behavior.recovery_state' },
        easing: { $value: ADAPTATION_EASE.dissolve, $type: 'cubicBezier', $description: 'Recovery easing — couture deceleration' },
      },
    },

    // — Spacing
    spacing: {
      0: { $value: '0px', $type: 'dimension' },
      1: { $value: '4px', $type: 'dimension' },
      2: { $value: '8px', $type: 'dimension' },
      3: { $value: '12px', $type: 'dimension' },
      4: { $value: '16px', $type: 'dimension' },
      5: { $value: '20px', $type: 'dimension' },
      6: { $value: '24px', $type: 'dimension' },
      8: { $value: '32px', $type: 'dimension' },
      10: { $value: '40px', $type: 'dimension' },
      12: { $value: '48px', $type: 'dimension' },
      16: { $value: '64px', $type: 'dimension' },
      20: { $value: '80px', $type: 'dimension' },
      24: { $value: '96px', $type: 'dimension' },
    },

    // — Typography
    typography: {
      family: {
        sans: { $value: "'Inter Variable', system-ui, -apple-system, sans-serif", $type: 'fontFamily' },
        display: { $value: "'Playfair Display Variable', Georgia, serif", $type: 'fontFamily' },
        mono: { $value: "'JetBrains Mono Variable', 'Fira Code', monospace", $type: 'fontFamily' },
      },
      size: {
        xs: { $value: '0.75rem', $type: 'fontSize' },
        sm: { $value: '0.875rem', $type: 'fontSize' },
        base: { $value: '1rem', $type: 'fontSize' },
        lg: { $value: '1.125rem', $type: 'fontSize' },
        xl: { $value: '1.25rem', $type: 'fontSize' },
        '2xl': { $value: '1.5rem', $type: 'fontSize' },
        '3xl': { $value: '1.875rem', $type: 'fontSize' },
        '4xl': { $value: '2.25rem', $type: 'fontSize' },
        '5xl': { $value: '3rem', $type: 'fontSize' },
      },
      leading: {
        tight: { $value: '1.25', $type: 'lineHeight' },
        normal: { $value: '1.5', $type: 'lineHeight' },
        relaxed: { $value: '1.75', $type: 'lineHeight' },
      },
      tracking: {
        tight: { $value: '-0.025em', $type: 'letterSpacing' },
        normal: { $value: '0em', $type: 'letterSpacing' },
        wide: { $value: '0.05em', $type: 'letterSpacing' },
        wider: { $value: '0.1em', $type: 'letterSpacing' },
      },
    },

    // — Elevation
    elevation: {
      sm: { $value: '0 1px 2px 0 hsl(240 10% 12% / 0.05)', $type: 'shadow' },
      md: { $value: '0 4px 6px -1px hsl(240 10% 12% / 0.1), 0 2px 4px -2px hsl(240 10% 12% / 0.1)', $type: 'shadow' },
      lg: { $value: '0 10px 15px -3px hsl(240 10% 12% / 0.1), 0 4px 6px -4px hsl(240 10% 12% / 0.1)', $type: 'shadow' },
      xl: { $value: '0 20px 25px -5px hsl(240 10% 12% / 0.1), 0 8px 10px -6px hsl(240 10% 12% / 0.1)', $type: 'shadow' },
      material: { $value: '0 0 0 1px hsl(240 10% 88%), 0 8px 32px hsl(290 40% 55% / 0.15)', $type: 'shadow', $description: 'MaterialSurface elevation — subtle pearl glow' },
      'material-active': { $value: '0 0 0 2px hsl(290 70% 55%), 0 12px 40px hsl(290 50% 55% / 0.25)', $type: 'shadow', $description: 'MaterialSurface active/focused state' },
    },

    // — Effect tokens (shader surface references)
    effect: {
      glow: {
        pearl: { $value: '0 0 24px 4px hsl(200 40% 90% / 0.6)', $type: 'shadow', $description: 'Pearl glow — iridescent surface bloom' },
        orchid: { $value: '0 0 32px 8px hsl(290 50% 70% / 0.4)', $type: 'shadow', $description: 'Orchid glow — accent bloom' },
        gold: { $value: '0 0 16px 2px hsl(45 80% 60% / 0.5)', $type: 'shadow', $description: 'Gold glow — cloisonné highlight' },
      },
      shimmer: {
        speed: { $value: '3000ms', $type: 'duration', $description: 'Nacre shimmer cycle duration' },
        opacity: { $value: '0.12', $type: 'other', $description: 'Idle shimmer opacity — subtle, not demanding' },
        'opacity-active': { $value: '0.35', $type: 'other', $description: 'Active shimmer opacity under cursor' },
      },
    },
  },
};

// ── 4. Write token source JSON for Style Dictionary ───────────────────────────

const SD_SOURCE = resolve(ROOT, 'src/generated/tokens.source.json');
mkdirSync(dirname(SD_SOURCE), { recursive: true });
writeFileSync(SD_SOURCE, JSON.stringify(tokenSource, null, 2), 'utf-8');
console.log('✔ Token source written:', SD_SOURCE);

// ── 5. Run Style Dictionary ───────────────────────────────────────────────────────

const DIST = resolve(ROOT, 'dist');
mkdirSync(DIST, { recursive: true });

const sd = new StyleDictionary({
  tokens: tokenSource,
  platforms: {

    // — CSS custom properties
    css: {
      transformGroup: 'css',
      prefix: 'nacre',
      buildPath: `${DIST}/`,
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: false,
            selector: ':root',
            fileHeader: () => [
              `nacre-orchid-atelier — generated tokens`,
              `profile: ${entity.id} v${raw.version}`,
              `seed: ${SEED}`,
              `generated: ${new Date().toISOString()}`,
              `DO NOT EDIT — regenerate with: npm run generate:tokens`,
            ],
          },
        },
        {
          destination: 'tokens.dark.css',
          format: 'css/variables',
          filter: (token) => token.path[0] === 'nacre' && token.path[1] === 'color',
          options: {
            outputReferences: false,
            selector: '[data-theme="dark"]',
            fileHeader: () => [
              'Dark mode color overrides — auto-generated',
              'DO NOT EDIT manually',
            ],
          },
        },
      ],
    },

    // — ESM JS constants
    js: {
      transformGroup: 'js',
      buildPath: `${DIST}/`,
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
          options: {
            fileHeader: () => [
              `nacre-orchid-atelier — ESM token constants`,
              `profile: ${entity.id} v${raw.version} | seed: ${SEED}`,
            ],
          },
        },
      ],
    },

    // — CJS constants
    cjs: {
      transformGroup: 'js',
      buildPath: `${DIST}/`,
      files: [
        {
          destination: 'tokens.cjs',
          format: 'javascript/module',
          options: {
            fileHeader: () => [
              `nacre-orchid-atelier — CJS token constants`,
              `profile: ${entity.id} v${raw.version} | seed: ${SEED}`,
            ],
          },
        },
      ],
    },

    // — Raw token manifest JSON
    json: {
      transformGroup: 'js',
      buildPath: `${DIST}/`,
      files: [
        {
          destination: 'tokens.json',
          format: 'json/nested',
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();
console.log('✔ Style Dictionary build complete');

// ── 6. Write Tailwind config extension ───────────────────────────────────────────────

const { nacre: t } = tokenSource;
const ts = t.color.surface;
const ta = t.color.accent;
const tm = t.color.material;

const tailwindConfig = `// nacre-orchid-atelier — Tailwind theme extension
// profile: ${entity.id} v${raw.version} | seed: ${SEED}
// DO NOT EDIT — regenerate with: npm run generate:tokens

/** @type {import('tailwindcss').Config['theme']} */
export const nacreTheme = {
  extend: {
    colors: {
      nacre: {
        // Surface layers
        surface: {
          DEFAULT: 'var(--nacre-color-surface-0)',
          1: 'var(--nacre-color-surface-1)',
          2: 'var(--nacre-color-surface-2)',
        },
        // Accent palette
        accent: {
          DEFAULT: 'var(--nacre-color-accent-primary)',
          secondary: 'var(--nacre-color-accent-secondary)',
        },
        // Text
        text: {
          DEFAULT: 'var(--nacre-color-text-primary)',
          muted: 'var(--nacre-color-text-secondary)',
          inverse: 'var(--nacre-color-text-inverse)',
          link: 'var(--nacre-color-text-link)',
        },
        // Border
        border: {
          DEFAULT: 'var(--nacre-color-border-subtle)',
          strong: 'var(--nacre-color-border-strong)',
          focus: 'var(--nacre-color-border-focus)',
        },
        // Material palette (named gems/materials)
        pearl:      'var(--nacre-color-material-pearl)',
        champagne:  'var(--nacre-color-material-champagne)',
        abalone:    'var(--nacre-color-material-abalone)',
        turquoise:  'var(--nacre-color-material-turquoise)',
        orchid:     'var(--nacre-color-material-orchid)',
        opal:       'var(--nacre-color-material-opal)',
        gold:       'var(--nacre-color-material-gold)',
      },
    },
    fontFamily: {
      sans:    ['Inter Variable', 'system-ui', '-apple-system', 'sans-serif'],
      display: ['Playfair Display Variable', 'Georgia', 'serif'],
      mono:    ['JetBrains Mono Variable', 'Fira Code', 'monospace'],
    },
    boxShadow: {
      'nacre-sm':              'var(--nacre-elevation-sm)',
      'nacre-md':              'var(--nacre-elevation-md)',
      'nacre-lg':              'var(--nacre-elevation-lg)',
      'nacre-xl':              'var(--nacre-elevation-xl)',
      'nacre-material':        'var(--nacre-elevation-material)',
      'nacre-material-active': 'var(--nacre-elevation-material-active)',
      'glow-pearl':            'var(--nacre-effect-glow-pearl)',
      'glow-orchid':           'var(--nacre-effect-glow-orchid)',
      'glow-gold':             'var(--nacre-effect-glow-gold)',
    },
    transitionDuration: {
      'nacre-enter':    'var(--nacre-motion-enter-duration)',
      'nacre-exit':     'var(--nacre-motion-exit-duration)',
      'nacre-idle':     'var(--nacre-motion-idle-duration)',
      'nacre-stress':   'var(--nacre-motion-stress-duration)',
      'nacre-recovery': 'var(--nacre-motion-recovery-duration)',
      'nacre-shimmer':  'var(--nacre-effect-shimmer-speed)',
    },
    transitionTimingFunction: {
      'nacre-enter':    'var(--nacre-motion-enter-easing)',
      'nacre-exit':     'var(--nacre-motion-exit-easing)',
      'nacre-bloom':    'cubic-bezier(0, 0, 0.2, 1)',
      'nacre-rebound':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
      'nacre-dissolve': 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    spacing: {
      // Re-export nacre spacing scale under nacre- prefix
      'nacre-1':  'var(--nacre-spacing-1)',
      'nacre-2':  'var(--nacre-spacing-2)',
      'nacre-3':  'var(--nacre-spacing-3)',
      'nacre-4':  'var(--nacre-spacing-4)',
      'nacre-6':  'var(--nacre-spacing-6)',
      'nacre-8':  'var(--nacre-spacing-8)',
      'nacre-12': 'var(--nacre-spacing-12)',
      'nacre-16': 'var(--nacre-spacing-16)',
      'nacre-24': 'var(--nacre-spacing-24)',
    },
  },
};
`;

writeFileSync(resolve(DIST, 'tailwind.config.js'), tailwindConfig, 'utf-8');
console.log('✔ Tailwind config written: dist/tailwind.config.js');

// ── 7. Write TypeScript declaration for tokens ──────────────────────────────────

const tokensDts = `// nacre-orchid-atelier — token constant type declarations
// Auto-generated — DO NOT EDIT
// profile: ${entity.id} v${raw.version} | seed: ${SEED}

/** All NACRE token constant names as a union type */
export type NacreTokenName = string;

/** Nacre theme extension for Tailwind CSS */
export declare const nacreTheme: {
  extend: {
    colors: Record<string, unknown>;
    fontFamily: Record<string, string[]>;
    boxShadow: Record<string, string>;
    transitionDuration: Record<string, string>;
    transitionTimingFunction: Record<string, string>;
    spacing: Record<string, string>;
  };
};
`;

writeFileSync(resolve(DIST, 'tailwind.config.d.ts'), tokensDts, 'utf-8');

// ── Summary ────────────────────────────────────────────────────────────────────

console.log(`
● nacre token generation complete
  profile  : ${entity.id} v${raw.version}
  seed     : ${SEED}
  outputs  :
    dist/tokens.css          (CSS custom properties — :root)
    dist/tokens.dark.css     (dark mode color overrides)
    dist/tokens.js           (ESM constants)
    dist/tokens.cjs          (CJS constants)
    dist/tokens.json         (raw manifest)
    dist/tailwind.config.js  (Tailwind theme extension)
    dist/tailwind.config.d.ts (TypeScript declarations)
`);
