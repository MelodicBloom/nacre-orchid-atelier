# Stage Gates — NACRE ORCHID ATELIER

> Each gate is a mandatory checkpoint. A failing gate sends the project **back**, not forward. No exceptions.

---

## GATE 1 — Technical Risk Retirement
**Triggers after:** Phase 1 Spike complete
**Question:** Can the full pipeline fire end-to-end with a single material?

### Checklist
- [ ] Nacre Inquiry Engine produces valid semantic profile JSON
- [ ] Style Dictionary consumes profile and emits CSS vars + JS tokens without errors
- [ ] One GLSL shader from `aether` compiles and renders in Chrome, Firefox, Safari, and Chrome Android
- [ ] One React `MaterialSurface` component renders the shader with token-driven uniforms
- [ ] No TypeScript errors (`tsc --noEmit` clean)
- [ ] No console errors or WebGL context warnings in any target browser

**PASS →** Proceed to Phase 2 Implementation
**FAIL →** Spike continues. Document the blocker in a GitHub Issue tagged `gate-blocker`.

---

## GATE 2 — Vertical Slice
**Triggers after:** First complete user journey is buildable
**Question:** Does one complete material theme work from inquiry profile to rendered component to docs page?

### Checklist
- [ ] At least one full material aesthetic (e.g. pearl iridescence) has tokens, shader, component, and docs page all wired
- [ ] Storybook story renders the component with live Controls
- [ ] Accessibility audit passes (axe-core, AA level) on that component
- [ ] Pixel regression baseline committed to `.github/qa-assets/`
- [ ] TSDoc blocks present on all exported functions and component props
- [ ] `attw` passes on the `shaders` and `components` packages

**PASS →** Proceed to Phase 3 Integration
**FAIL →** Return to Implementation. File issues for each failing item.

---

## GATE 3 — Integration Integrity
**Triggers after:** All packages wired together in monorepo
**Question:** Does the full system compose correctly at scale?

### Checklist
- [ ] Token output resolves correctly inside Tailwind on the docs site
- [ ] CLI token generation from inquiry profile produces valid output without manual correction
- [ ] No cross-package `src/` imports — all imports use public `index.ts` entry points
- [ ] 50 simultaneous `MaterialSurface` renders complete without GPU memory spike > 100MB
- [ ] All existing pixel regression tests still pass
- [ ] CI pipeline completes in < 5 minutes

**PASS →** Proceed to Phase 4 Hardening
**FAIL →** Return to Integration. Each failure becomes a tagged GitHub Issue.

---

## GATE 4 — Release Readiness
**Triggers after:** Hardening phase complete
**Question:** Is the system safe to ship to external consumers?

### Checklist
- [ ] `shaders` bundle ≤ 40KB gzipped
- [ ] `components` bundle ≤ 80KB gzipped
- [ ] Zero GPU memory leaks after 100 shader context create/destroy cycles
- [ ] All components pass axe-core AA accessibility audit
- [ ] Mobile validation complete: mid-range Android + base M-series MacBook
- [ ] Docs site Lighthouse performance score ≥ 90
- [ ] `attw` passes with zero errors on all packages
- [ ] Zero ESLint warnings on `main`
- [ ] Changelog is human-readable and consumer-facing (no internal jargon)

**PASS →** Proceed to Phase 5 Release
**FAIL →** Return to Hardening. No exceptions for bundle size or memory leaks.

---

## GATE 5 — Shipped
**Triggers after:** All release tasks complete
**Question:** Has the work been made available and discoverable?

### Checklist
- [ ] npm package(s) published with correct `exports` map
- [ ] GitHub release tag created with populated release notes
- [ ] Docs atlas live on Vercel
- [ ] `aether` gallery updated with new shader entries
- [ ] Gumroad product updated or created (via agent-runtime-control-center)
- [ ] `.ai/prompts/` updated to reflect any new system patterns
- [ ] MelodicBloom org README updated to reference new release

**PASS →** Feature is Done. Archive the gate checklist in the GitHub release notes.

---

## Gate Status Tracker

| Gate | Status | Blocking Issue | Date Cleared |
|---|---|---|---|
| Gate 1 — Technical Risk | 🔴 Not Started | — | — |
| Gate 2 — Vertical Slice | ⬜ Locked | Awaits Gate 1 | — |
| Gate 3 — Integration | ⬜ Locked | Awaits Gate 2 | — |
| Gate 4 — Release Readiness | ⬜ Locked | Awaits Gate 3 | — |
| Gate 5 — Shipped | ⬜ Locked | Awaits Gate 4 | — |
