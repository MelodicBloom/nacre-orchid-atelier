# QA Protocol — NACRE ORCHID ATELIER

> Quality assurance spans deterministic engineering checks and subjective aesthetic validation. Both are required.

---

## 1. Automated QA (CI — runs on every PR)

### Type Safety
```bash
npm run typecheck   # tsc --noEmit across all packages
```
- Zero errors required. No `@ts-ignore` without a documented justification comment.

### Lint
```bash
npm run lint        # ESLint + Prettier check
```
- Zero warnings on `main`. PRs may have warnings but must resolve before merge.

### Unit Tests
```bash
npm run test        # Vitest
```
- All token transformation functions: 100% coverage
- All shader uniform validation functions: 100% coverage
- Component logic (non-visual): 80% coverage minimum

### Visual Regression
```bash
npm run test:visual  # Playwright + pixelmatch
```
- Reference PNGs stored in `.github/qa-assets/shaders/` and `.github/qa-assets/components/`
- Tolerance: 0.1% pixel diff allowed (accounts for anti-aliasing variance)
- Any diff > 0.1% fails CI and requires explicit approval with updated reference image

### Bundle Size
```bash
npm run build:analyze  # bundlesize or size-limit
```
- `shaders` package: ≤ 40KB gzipped
- `components` package: ≤ 80KB gzipped
- `tokens` package: ≤ 10KB gzipped

### Type Export Validation
```bash
npx attw --pack     # Are the Types Wrong
```
- Zero errors. Dual-package hazards are a hard block.

---

## 2. Generative Determinism Tests

Because this system involves procedural generation, **determinism is a first-class concern**.

- All pseudo-random values must accept a `seed` parameter
- The same seed must always produce identical token values, shader uniforms, and visual output
- A dedicated test suite `determinism.test.ts` asserts seed consistency across:
  - Token palette generation
  - Shader noise function outputs (sampled at fixed UV coordinates)
  - Any procedural pattern or gradient in the generative system

---

## 3. Accessibility Audit

```bash
npm run test:a11y   # axe-core via jest-axe or Playwright
```

Required level: **WCAG 2.1 AA**

All MaterialSurface components must pass:
- Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- Keyboard navigability
- ARIA roles present where semantic HTML is insufficient
- No focus traps

Note: Iridescent and animated surfaces may create motion sensitivity issues. All animated components must respect `prefers-reduced-motion`.

---

## 4. GPU / Performance Audit

Run manually during Phase 4 Hardening and before Gate 4:

### Shader Performance Tiers
| Tier | Target Device | Target FPS | Max Draw Calls |
|---|---|---|---|
| low | Mid-range Android (2023) | 60fps | 2 |
| mid | Base M-series MacBook | 60fps | 8 |
| high | Desktop GPU (RTX 3070+) | 60fps | 32 |

### Memory Leak Protocol
1. Open Chrome DevTools → Memory tab
2. Create 100 `MaterialSurface` instances programmatically
3. Destroy all 100 instances
4. Force garbage collection
5. Take heap snapshot
6. Assert heap returns to within 10% of baseline — any greater delta is a leak

### WebGL Context Loss
- Simulate context loss via `WEBGL_lose_context` extension
- Assert graceful fallback to CSS-only surface with no uncaught errors

---

## 5. Manual QA Checklist (per release)

### Browser Matrix
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, macOS)
- [ ] Chrome Android (mid-range device)
- [ ] Safari iOS (iPhone SE or equivalent — lowest spec target)

### Visual Aesthetic Validation
- [ ] Pearl iridescence shifts correctly under simulated light rotation
- [ ] Orchid petal gradients render without color banding
- [ ] Lace micropatterns remain legible at 1x and 2x display densities
- [ ] Gold cloisonné line work renders crisp at all zoom levels
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Dark mode token overrides produce correct contrast on all surfaces

### Docs Site
- [ ] All component stories load in Storybook without console errors
- [ ] Token table in docs reflects current `tokens.json` (no stale data)
- [ ] Search returns relevant results for key terms: `MaterialSurface`, `iridescent`, `token`, `shader`

---

## 6. Reference Asset Management

```
.github/qa-assets/
├── shaders/
│   ├── pearl-iridescence-seed-42.png
│   ├── orchid-gradient-seed-42.png
│   └── [shader-name]-seed-[seed].png
└── components/
    ├── material-surface-default.png
    ├── material-surface-dark.png
    └── [component-name]-[variant].png
```

Naming convention: `[subject]-[variant/seed].[ext]`
Update rule: reference assets are only replaced when a **visual change is intentional and approved**. CI failure on a reference diff requires explicit sign-off in the PR description.
