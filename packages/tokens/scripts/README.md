# Token Generation Scripts

## `generate.js`

The main token generation pipeline. Reads a NacreProfile JSON, derives a full token set, and emits all output formats via Style Dictionary.

### Usage

```bash
# From repo root
npm run generate:tokens

# From the tokens package
cd packages/tokens
node scripts/generate.js

# Custom profile and seed
node scripts/generate.js --profile ./my-profile.json --seed 99
```

### Outputs

| File | Format | Usage |
|---|---|---|
| `dist/tokens.css` | CSS custom properties | Import in any CSS/HTML |
| `dist/tokens.dark.css` | CSS dark mode overrides | Add `data-theme="dark"` to `<html>` |
| `dist/tokens.js` | ESM constants | `import { NACRE_COLOR_SURFACE_0 } from '@nacre/tokens'` |
| `dist/tokens.cjs` | CJS constants | `require('@nacre/tokens')` |
| `dist/tokens.json` | Raw manifest | Design tool integrations, Figma tokens |
| `dist/tailwind.config.js` | Tailwind theme extension | `import { nacreTheme } from '@nacre/tokens/tailwind'` |

### How Token Values Are Derived

Every value traces back to the inquiry profile:

| Token Category | Source in Profile |
|---|---|
| `color.surface.*` | `semantic_axes` warmth + luminosity positions |
| `color.accent.*` | `semantic_axes` vibrancy position |
| `color.material.*` | `symbolism.material_associations` + fixed palette |
| `motion.*.duration` | `composition.rhythm_type` → base ms |
| `motion.*.easing` | `behavior.adaptation_style` → cubic-bezier |
| `effect.shimmer.*` | `behavior.idle_state` description |

### Adding a New Profile

1. Generate a profile from [nacre-inquiry-engine](https://github.com/MelodicBloom/nacre-inquiry-engine)
2. Save it to `packages/tokens/fixtures/`
3. Run `node scripts/generate.js --profile packages/tokens/fixtures/your-profile.json --seed 42`
4. Commit the generated `dist/` outputs as reference artifacts
5. Update `.github/qa-assets/` with new reference renders if shaders changed
