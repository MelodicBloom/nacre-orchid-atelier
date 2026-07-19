#!/usr/bin/env node
/**
 * capture-reference-headless.js
 *
 * Headless WebGL reference render for nacre-pearl-bloom at seed 42.
 * Uses headless-gl (Node WebGL) + pngjs to produce a deterministic PNG
 * committed to .github/qa-assets/nacre-pearl-bloom-seed-42-headless.png
 *
 * Dependencies (add to root devDependencies):
 *   gl     ^7.0.0
 *   pngjs  ^7.0.0
 *
 * Usage:
 *   node packages/shaders/scripts/capture-reference-headless.js
 *   node packages/shaders/scripts/capture-reference-headless.js --width 1600 --height 1200
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

const args   = process.argv.slice(2);
const WIDTH  = parseInt(args[args.indexOf('--width')  + 1] || '800',  10);
const HEIGHT = parseInt(args[args.indexOf('--height') + 1] || '600',  10);
const OUT    = resolve(__dirname, '../../../.github/qa-assets/nacre-pearl-bloom-seed-42-headless.png');

console.log(`\n○ nacre-pearl-bloom headless reference render`);
console.log(`  resolution : ${WIDTH}x${HEIGHT}`);
console.log(`  output     : ${OUT}\n`);

let gl;
try {
  gl = require('gl')(WIDTH, HEIGHT, { preserveDrawingBuffer: true });
} catch (e) {
  console.error('✕ headless-gl not available. Run: npm install --save-dev gl');
  process.exit(1);
}
if (!gl) { console.error('✕ Failed to create headless WebGL context.'); process.exit(1); }
console.log('✔ headless-gl context created');

const VERT_SRC = `
precision highp float;
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAG_SRC = readFileSync(
  resolve(__dirname, '../src/presets/nacre-pearl-bloom.frag.glsl'), 'utf-8'
);

function compileShader(type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error:\n${info}`);
  }
  return shader;
}

const vert = compileShader(gl.VERTEX_SHADER,   VERT_SRC);
const frag = compileShader(gl.FRAGMENT_SHADER, FRAG_SRC);
console.log('✔ Shaders compiled');

const program = gl.createProgram();
gl.attachShader(program, vert);
gl.attachShader(program, frag);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS))
  throw new Error(`Program link error:\n${gl.getProgramInfoLog(program)}`);
gl.useProgram(program);
console.log('✔ Program linked');

const quad = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
const buf  = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
const posLoc = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(posLoc);
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

// Canonical nacre-gate uniforms — seed 42, t=0
// Fixed constants: any change here requires regenerating the reference PNG.
const U = {
  u_time:           0.0,
  u_resolution:     [WIDTH, HEIGHT],
  u_pointer:        [0.5, 0.5],
  u_intensity:      0.72,
  u_iridescence:    0.60,
  u_shimmerOpacity: 0.12,
  u_baseColor:      [0.8262, 0.8488, 0.8879],
  u_accentColor:    [0.3677, 0.2449, 0.5768],
  u_reducedMotion:  0.0,
};

const loc = (n) => gl.getUniformLocation(program, n);
gl.uniform1f(loc('u_time'),           U.u_time);
gl.uniform2f(loc('u_resolution'),     U.u_resolution[0], U.u_resolution[1]);
gl.uniform2f(loc('u_pointer'),        U.u_pointer[0],    U.u_pointer[1]);
gl.uniform1f(loc('u_intensity'),      U.u_intensity);
gl.uniform1f(loc('u_iridescence'),    U.u_iridescence);
gl.uniform1f(loc('u_shimmerOpacity'), U.u_shimmerOpacity);
gl.uniform3f(loc('u_baseColor'),      ...U.u_baseColor);
gl.uniform3f(loc('u_accentColor'),    ...U.u_accentColor);
gl.uniform1f(loc('u_reducedMotion'),  U.u_reducedMotion);
console.log('✔ Uniforms set (nacre-gate seed 42, t=0)');

gl.viewport(0, 0, WIDTH, HEIGHT);
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 6);
gl.finish();
console.log('✔ Frame rendered');

const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
gl.readPixels(0, 0, WIDTH, HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

// Flip vertically: WebGL origin is bottom-left, PNG expects top-left
const flipped = new Uint8Array(WIDTH * HEIGHT * 4);
for (let y = 0; y < HEIGHT; y++) {
  const src = (HEIGHT - 1 - y) * WIDTH * 4;
  const dst = y * WIDTH * 4;
  flipped.set(pixels.slice(src, src + WIDTH * 4), dst);
}

let PNG;
try {
  PNG = require('pngjs').PNG;
} catch (e) {
  console.error('✕ pngjs not available. Run: npm install --save-dev pngjs');
  process.exit(1);
}

const png  = new PNG({ width: WIDTH, height: HEIGHT });
png.data   = Buffer.from(flipped);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, PNG.sync.write(png));

console.log(`✔ PNG written: ${OUT}`);
console.log(`\n● Reference render complete`);
console.log(`  Commit this file to .github/qa-assets/ and uncomment the pixel-diff step in .github/workflows/visual-qa.yml\n`);
