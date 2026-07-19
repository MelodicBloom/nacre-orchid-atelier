/**
 * render-reference-playwright.ts
 *
 * Playwright-based reference render for nacre-pearl-bloom at seed 42.
 * Launches Chromium headless (SwiftShader software rasteriser — no GPU required),
 * mounts a minimal HTML fixture, renders one synchronous frame, and captures
 * a screenshot of the canvas element.
 *
 * Output: .github/qa-assets/nacre-pearl-bloom-seed-42-playwright.png
 *
 * Usage:
 *   npx ts-node packages/shaders/scripts/render-reference-playwright.ts
 *
 * Requires:
 *   npm install --save-dev playwright
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../../../.github/qa-assets/nacre-pearl-bloom-seed-42-playwright.png');

const UNIFORMS = {
  u_time:           0.0,
  u_resolution:     [800, 600],
  u_pointer:        [0.5, 0.5],
  u_intensity:      0.72,
  u_iridescence:    0.60,
  u_shimmerOpacity: 0.12,
  u_baseColor:      [0.8262, 0.8488, 0.8879],
  u_accentColor:    [0.3677, 0.2449, 0.5768],
  u_reducedMotion:  0.0,
};

async function main(): Promise<void> {
  const fragGlsl = readFileSync(
    resolve(__dirname, '../src/presets/nacre-pearl-bloom.frag.glsl'), 'utf-8'
  )
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 800px; height: 600px; overflow: hidden; background: #000; }
    canvas { display: block; width: 800px; height: 600px; }
  </style>
</head>
<body>
  <canvas id="c" width="800" height="600"></canvas>
  <script>
    const U = ${JSON.stringify(UNIFORMS)};
    const FRAG = \`${fragGlsl}\`;
    const VERT = \`precision highp float;attribute vec2 a_position;void main(){gl_Position=vec4(a_position,0.,1.);}\`;
    const canvas = document.getElementById('c');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { document.body.setAttribute('data-error','NO_WEBGL'); throw new Error('No WebGL'); }
    function sh(type, src) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const quad = new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);
    const buf  = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const p = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(p); gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
    const l = (n) => gl.getUniformLocation(prog, n);
    gl.uniform1f(l('u_time'), U.u_time);
    gl.uniform2f(l('u_resolution'), U.u_resolution[0], U.u_resolution[1]);
    gl.uniform2f(l('u_pointer'), U.u_pointer[0], U.u_pointer[1]);
    gl.uniform1f(l('u_intensity'), U.u_intensity);
    gl.uniform1f(l('u_iridescence'), U.u_iridescence);
    gl.uniform1f(l('u_shimmerOpacity'), U.u_shimmerOpacity);
    gl.uniform3f(l('u_baseColor'), ...U.u_baseColor);
    gl.uniform3f(l('u_accentColor'), ...U.u_accentColor);
    gl.uniform1f(l('u_reducedMotion'), U.u_reducedMotion);
    gl.viewport(0, 0, 800, 600); gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6); gl.finish();
    document.body.setAttribute('data-render-complete', 'true');
  </script>
</body>
</html>`;

  console.log('\n○ nacre-pearl-bloom Playwright reference render');
  console.log('  resolution : 800x600  |  seed 42, t=0');
  console.log(`  output     : ${OUT}\n`);

  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--enable-webgl', '--use-angle=swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 800, height: 600 });
  await page.setContent(html, { waitUntil: 'domcontentloaded' });

  await page.waitForFunction(
    () => document.body.getAttribute('data-render-complete') === 'true',
    { timeout: 10_000 },
  );

  const errAttr = await page.$eval('body', (b) => b.getAttribute('data-error'));
  if (errAttr) {
    console.error(`✕ Page error: ${errAttr}`);
    await browser.close();
    process.exit(1);
  }

  const canvas = await page.$('canvas#c');
  if (!canvas) throw new Error('Canvas element not found');

  const screenshot = await canvas.screenshot({ type: 'png' });
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, screenshot);

  await browser.close();

  console.log(`✔ PNG written: ${OUT}`);
  console.log('\n● Reference render complete');
  console.log('  Commit to .github/qa-assets/ and uncomment the pixel-diff step in visual-qa.yml\n');
}

main().catch((err) => { console.error(err); process.exit(1); });
