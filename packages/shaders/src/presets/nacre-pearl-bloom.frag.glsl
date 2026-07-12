/**
 * nacre-pearl-bloom.frag.glsl
 *
 * Mother-of-pearl thin-film iridescence shader.
 * Preset: nacre-pearl-bloom  |  Family: nacre  |  Tier: webgl2 / webgl1
 *
 * Aesthetic intent: guarded luminosity — a bilateral surface that blooms
 * outward from the pointer and returns to a subtle iridescent idle shimmer.
 * Source profile: nacre-gate v1.0.0 (rhythm: bloom, adaptation: bloom)
 *
 * Uniform interface is SEMANTIC — values are derived from NacreTokenSet,
 * not from raw aesthetic numbers. See tokens-to-uniforms.ts for the mapping.
 *
 * Provenance: original GLSL authored for Nacre Orchid Atelier.
 * Structural colour technique informed by standard thin-film interference
 * mathematics (public domain optics).
 */

precision highp float;

// ── Uniforms ───────────────────────────────────────────────────────────────
uniform float u_time;           // elapsed seconds
uniform vec2  u_resolution;     // canvas size in pixels
uniform vec2  u_pointer;        // normalised pointer [0-1]
uniform float u_intensity;      // material intensity (revealed_concealed inverse)
uniform float u_iridescence;    // thin-film strength (tactile_spectral axis)
uniform float u_shimmerOpacity; // idle shimmer amplitude
uniform vec3  u_baseColor;      // surface base colour (linearised RGB)
uniform vec3  u_accentColor;    // orchid accent colour (linearised RGB)
uniform float u_reducedMotion;  // 1.0 = freeze time-dependent uniforms

// ── Constants ──────────────────────────────────────────────────────────────
const float PI       = 3.14159265358979;
const float TWO_PI   = 6.28318530717959;
// Thin-film wavelength band centres (nm, normalised to [0-1] for colour shift)
const vec3  LAMBDA   = vec3(0.65, 0.55, 0.45); // R G B peak wavelengths
// Refractive index of nacre aragonite layer (simplified)
const float IOR      = 1.59;
// Thin-film thickness range (nm)
const float FILM_MIN = 200.0;
const float FILM_MAX = 600.0;

// ── Utilities ─────────────────────────────────────────────────────────────

// Smooth remap [inMin, inMax] -> [outMin, outMax]
float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * clamp((v - inMin) / (inMax - inMin), 0.0, 1.0);
}

// Improved smooth noise — avoids visible grid artefacts
float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 19.19);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep
  return mix(
    mix(hash(i),           hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// ── Thin-film interference ─────────────────────────────────────────────────
// Computes per-channel reflectance for a thin dielectric film.
// Based on optical path difference: OPD = 2 * IOR * thickness * cos(theta)
// Constructive interference when OPD = m * lambda (integer m)
vec3 thinFilm(float thickness, float cosTheta) {
  vec3 opd = 2.0 * IOR * thickness * cosTheta * LAMBDA;
  // Reflectance as cosine of phase difference (simplified Fabry-Perot)
  return 0.5 + 0.5 * cos(opd * TWO_PI);
}

// ── Bilateral proximity bloom ───────────────────────────────────────────────
// Intensity ramps symmetrically outward from pointer position.
// Respects the bilateral symmetry_type from the nacre-gate profile.
float proximityBloom(vec2 uv, vec2 pointer) {
  // Bilateral: reflect uv across vertical axis so both halves respond
  vec2 uvBilateral = vec2(abs(uv.x - 0.5) * 2.0, uv.y);
  vec2 ptrBilateral = vec2(abs(pointer.x - 0.5) * 2.0, pointer.y);
  float d = distance(uvBilateral, ptrBilateral);
  // Smooth falloff — bloom easing (0, 0, 0.2, 1) approximated as smoothstep
  return 1.0 - smoothstep(0.0, 1.2, d);
}

// ── Main ───────────────────────────────────────────────────────────────────
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // Respect prefers-reduced-motion: freeze time if flag is set
  float t = u_time * mix(1.0, 0.0, u_reducedMotion);

  // — 1. Proximity bloom (bilateral)
  float bloom = proximityBloom(uv, u_pointer);
  float bloomDriven = mix(u_shimmerOpacity, u_intensity, bloom);

  // — 2. Animated film thickness
  //    Slow drift across the surface (shimmer) + pointer bloom offset
  float drift = noise(uv * 4.0 + vec2(t * 0.12, t * 0.08)) * 0.5 + 0.5;
  float thickness = mix(FILM_MIN, FILM_MAX, drift + bloom * 0.3);

  // — 3. View angle (simplified: cosTheta from UVs, no camera needed)
  //    Approximates how nacre shifts colour with viewing angle
  vec2 centred = uv - vec2(0.5);
  float cosTheta = 1.0 - 0.6 * length(centred);

  // — 4. Thin-film reflectance
  vec3 film = thinFilm(thickness, cosTheta);

  // — 5. Idle shimmer (very low amplitude sweep)
  float shimmerWave = 0.5 + 0.5 * sin(uv.x * PI * 3.0 + t * 2.0);
  vec3 shimmer = mix(u_baseColor, u_accentColor, shimmerWave * u_shimmerOpacity);

  // — 6. Composite: base + thin-film + bloom accent
  vec3 base  = mix(u_baseColor, shimmer, u_shimmerOpacity);
  vec3 iri   = mix(base, base * film * 1.4, u_iridescence * bloomDriven);
  vec3 final = mix(iri, u_accentColor, bloom * u_intensity * 0.18);

  // — 7. Soft vignette (matches bilateral centre-weight composition)
  float vignette = 1.0 - smoothstep(0.3, 1.0, length(centred) * 1.4);
  final *= mix(1.0, vignette, 0.3);

  gl_FragColor = vec4(clamp(final, 0.0, 1.0), 1.0);
}
