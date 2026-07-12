# Reference Render Capture — nacre-pearl-bloom

This document describes how to capture and commit a deterministic PNG reference render for the `nacre-pearl-bloom` preset at seed 42.

## Target

- Preset: `nacre-pearl-bloom`
- Profile: `nacre-gate` v1.0.0
- Seed: 42
- Resolution: 800x600
- Pointer: `[0.5, 0.5]` (center)
- Time: `t = 0`
- Reduced motion: off

The resulting PNG will be committed to `.github/qa-assets/nacre-pearl-bloom-seed-42.png` and used by visual regression tests.

## Capture Options

You can use any of the following approaches:

1. **Playwright-based browser capture**
   - Create a minimal HTML page that mounts `MaterialSurface` and a `ShaderCanvas` wired to `nacre-pearl-bloom`.
   - Use a Playwright test to:
     - Navigate to the page
     - Wait for the first animation frame
     - Capture a screenshot of the canvas only
     - Save it as `nacre-pearl-bloom-seed-42.png`

2. **Headless WebGL (node-canvas + headless-gl)**
   - Use `headless-gl` to create a WebGL context in Node.
   - Compile `nacre-pearl-bloom.frag.glsl` with a simple full-screen quad vertex shader.
   - Set uniforms from `tokensToNacrePearlBloomUniforms()` with the canonical Nacre Gate token slice.
   - Render once at `t = 0`, then read pixels and write them to a PNG via `pngjs`.

3. **Manual browser capture (temporary)**
   - Run the demo app locally with a single `MaterialSurface` instance configured to the target parameters.
   - Use the browser devtools to capture a PNG of the canvas.
   - Save and commit the file to `.github/qa-assets/`.

## Determinism Requirements

- Use the canonical Nacre Gate token slice at seed 42 (from `@nacre/tokens`).
- Do not introduce randomness in the shader uniforms.
- Ensure the canvas resolution and pointer position are fixed.
- Use the same browser and GPU configuration for subsequent captures whenever possible.

Once the PNG is committed, a visual regression test can compare future renders against this reference with a small tolerance (e.g., 1-2% per-pixel difference).
