import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { profileToTokens, validateProfile } from '@nacre/tokens';
import { MaterialSurface } from '@nacre/components';
import { tokensToNacrePearlBloomUniforms } from '@nacre/shaders';
import profile from '../../tokens/fixtures/example-profile.json';
import './style.css';

function App() {
  const [seed, setSeed] = useState(42);
  const [pointer, setPointer] = useState([0.5, 0.5]);
  const valid = validateProfile(profile).valid;
  const tokens = useMemo(() => profileToTokens(profile, seed), [seed]);
  const uniforms = useMemo(() => tokensToNacrePearlBloomUniforms(tokens, {}), [tokens]);
  const groups = ['surface', 'accent', 'text', 'border'];
  return (
    <main>
      <header>
        <p className="eyebrow">MelodicBloom · Living material design system</p>
        <h1>Nacre Orchid Atelier</h1>
        <p className="lede">{profile.layers.essence.one_sentence_thesis}</p>
        <p className="meta">Profile <b>{profile.entity.name}</b> · schema {profile.version} · {valid ? 'valid ✓' : 'invalid'} · seed
          <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value) || 0)} /></p>
      </header>
      <section className="stage"
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPointer([(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]); }}>
        <MaterialSurface tokens={tokens} pointer={pointer} resolution={[960, 420]}>
          <div className="surface-copy"><h2>nacre-pearl-bloom</h2><p>{profile.layers.essence.core_metaphor}</p><small>move pointer to steer the sheen</small></div>
        </MaterialSurface>
      </section>
      <section className="grid">
        {groups.map((g) => (
          <div key={g} className="card"><h3>{g}</h3>
            {tokens.color[g].map((t) => (
              <div key={t.cssVar} className="swatch"><span style={{ background: t.value }} /><code>{t.cssVar}</code><em>{t.value}</em></div>
            ))}
          </div>
        ))}
        <div className="card"><h3>semantic axes</h3>
          {profile.layers.semantic_axes.map((a) => (
            <div key={a.axis_id} className="axis"><label>{a.left_pole} ↔ {a.right_pole}</label><meter min="0" max="1" value={a.position} /><em>{a.position}</em></div>
          ))}
        </div>
        <div className="card"><h3>shader uniforms</h3>
          <pre>{JSON.stringify({ u_intensity: uniforms.u_intensity, u_iridescence: uniforms.u_iridescence, u_shimmerOpacity: uniforms.u_shimmerOpacity, u_baseColor: uniforms.u_baseColor, u_accentColor: uniforms.u_accentColor }, (k, v) => typeof v === 'number' ? Math.round(v * 1000) / 1000 : v, 2)}</pre>
        </div>
      </section>
      <footer>Inquiry profile → profileToTokens() → tokensToNacrePearlBloomUniforms() → MaterialSurface · <a href="https://github.com/MelodicBloom/nacre-orchid-atelier">GitHub</a> · <a href="https://github.com/MelodicBloom/nacre-inquiry-engine">Inquiry Engine</a></footer>
    </main>
  );
}
createRoot(document.getElementById('root')).render(<App />);
