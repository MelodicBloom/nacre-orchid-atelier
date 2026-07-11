# Build Specification — NACRE ORCHID ATELIER

> Version: 0.1.0 | Status: Active | Owner: MelodicBloom

---

## 1. North Star

**"A living material design system where every visual decision — token, shader, component — derives deterministically from a single semantic inquiry profile, making the system infinitely themeable without breaking its aesthetic integrity."**

This sentence is the decision filter. If a proposed feature cannot be traced back to a token, a shader, or a component that serves the inquiry profile, it does not belong in this repo.

---

## 2. Product Architecture

| Layer | Package | Input | Output | Dependencies |
|---|---|---|---|---|
| Inquiry | `nacre-inquiry-engine` | Human intent | Semantic profile JSON | None |
| Tokens | `packages/tokens` | Profile JSON | CSS vars, JS tokens, Tailwind config | Style Dictionary |
| Shaders | `packages/shaders` | Token values | GLSL iridescent surfaces | aether, three.js |
| Components | `packages/components` | Tokens + Shaders | React MaterialSurface | React, Framer Motion |
| Docs | `packages/docs` | All above | Next.js living atlas | Next.js, Storybook |

---

## 3. Technical Standards

### Language and Tooling
- **TypeScript strict mode** — `noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes`
- **Bundler**: tsup for library packages, Next.js for docs
- **Package exports**: dual ESM/CJS with explicit `exports` map, validated by `attw`
- **Monorepo**: npm workspaces or Turborepo with shared `tsconfig.base.json`
- **GLSL**: Inline via `vite-plugin-glsl` or `raw-loader`; all shaders must declare precision qualifiers
- **Linting**: ESLint + Prettier; zero warnings policy on `main`

### Token Standards
- All tokens defined in `tokens.json` following the [Design Tokens Community Group](https://design-tokens.github.io/community-group/format/) format
- Token categories: `color`, `typography`, `spacing`, `motion`, `elevation`, `material` (shader surface refs)
- Style Dictionary transforms tokens to: CSS custom properties, JS/ESM constants, Tailwind theme extension
- No hardcoded values in components — every visual value must reference a token

### Shader Standards
- Fragment shaders must declare `precision mediump float` minimum
- Every shader must have a corresponding `*.meta.json` describing: name, aesthetic, uniform inputs, performance tier (low/mid/high)
- Performance tiers: `low` targets 60fps on mid-range Android; `high` targets desktop GPU only
- Reference renders committed to `.github/qa-assets/shaders/` for pixel regression

### Component Standards
- Every exported component must have: TypeScript props interface, TSDoc block, Storybook story, accessibility audit pass (axe-core)
- Props naming follows React community conventions (`on*` for events, `is*`/`has*` for booleans)
- No component may import directly from another component's internal files — only from its public `index.ts`

---

## 4. Build Outputs

```
dist/
├── tokens/
│   ├── tokens.css          # CSS custom properties
│   ├── tokens.js           # ESM JS constants
│   └── tailwind.config.js  # Tailwind theme extension
├── shaders/
│   ├── index.esm.js        # ESM shader bundle
│   ├── index.cjs.js        # CJS shader bundle
│   └── index.d.ts          # TypeScript declarations
└── components/
    ├── index.esm.js
    ├── index.cjs.js
    └── index.d.ts
```

All bundles must pass `attw` (Are the Types Wrong) with zero errors before release.

---

## 5. Development Phases

### Phase 0 — Scaffolding (Current)
- [x] Repository initialized
- [x] Build spec committed
- [x] AI prompt library committed
- [x] Stage gates committed
- [ ] Monorepo workspace configured
- [ ] CI/CD workflows active
- [ ] `nacre-inquiry-engine` linked as input

### Phase 1 — Spike
Goal: Validate the full pipeline end-to-end with a single material (pearl iridescence).
- Generate one semantic profile from `nacre-inquiry-engine`
- Transform profile into 12 base tokens
- Compile one iridescent GLSL shader from `aether`
- Render shader inside one React `MaterialSurface` component
- Confirm cross-browser: Chrome, Firefox, Safari, Chrome Android

**Gate 1 blocks Phase 2.** See `GATES.md`.

### Phase 2 — Implementation
Documentation-first rule: every public function must have TSDoc + usage example before logic is merged.
- Build full token pipeline for all 7 material aesthetics
- Implement 5 core `MaterialSurface` variants
- Wire Storybook with Controls and accessibility addon
- Add pixel regression tests for each shader reference render

**Gate 2 blocks Phase 3.**

### Phase 3 — Integration
- Wire token output into Tailwind config consumed by docs site
- Confirm CLI token generation from inquiry profile works end-to-end
- Validate monorepo package resolution: no internal `src/` imports across packages
- Load test: render 50 MaterialSurface instances simultaneously, measure GPU memory

**Gate 3 blocks Phase 4.**

### Phase 4 — Hardening
- Bundle size analysis: `shaders` < 40KB gzipped, `components` < 80KB gzipped
- GPU memory leak test: create/destroy 100 shader contexts, assert no leaks
- Accessibility audit: all components pass axe-core at AA level
- Mobile validation: mid-range Android + base M-series MacBook
- Lighthouse performance score ≥ 90 on docs site

**Gate 4 blocks Phase 5.**

### Phase 5 — Release
- Changeset documented with consumer-facing description
- Docs atlas deployed to Vercel preview
- `aether` freemium gallery updated with new shader entries
- GitHub release tag created
- Agent-runtime-control-center notified for Gumroad packaging

**Gate 5 = shipped.**

---

## 6. Skill Matrix

| Domain | Skill | Level Required | Owner |
|---|---|---|---|
| Core | TypeScript strict architecture | Advanced | Builder |
| Core | GLSL shader writing + precision | Advanced | Builder |
| Core | React component API design | Advanced | Builder |
| Core | Style Dictionary token pipeline | Intermediate | Builder |
| Adjacent | CI/CD YAML (GitHub Actions) | Intermediate | Builder |
| Adjacent | Changeset + semver management | Intermediate | Builder |
| Adjacent | Storybook visual regression | Intermediate | Builder |
| Review | Accessibility auditing (axe-core) | Intermediate | Builder / AI |
| Review | GPU profiling (Chrome DevTools) | Advanced | Builder |
| Review | Bundle size analysis (bundlesize) | Intermediate | Builder / AI |

---

## 7. Definition of Done

A feature branch is **Done** when ALL six conditions are true:

1. ✅ **CI passes** — type check, lint, unit tests, visual regression all green on the PR
2. ✅ **Changeset filed** — `.changeset/*.md` describes the change in consumer-facing language
3. ✅ **Documentation updated** — TSDoc, Storybook story, or docs atlas page updated
4. ✅ **Hardware validated** — feature tested on mid-range Android + M-series MacBook
5. ✅ **AI prompt library current** — `.ai/prompts/` updated if feature introduced new patterns
6. ✅ **Reference render committed** — for any shader or visual change, a new PNG committed to `.github/qa-assets/`

---

*Governed by [`GATES.md`](./GATES.md) | AI sessions governed by [`.ai/prompts/`](./.ai/prompts/)*
