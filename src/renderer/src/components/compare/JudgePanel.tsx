import { I } from '@/icons';

export function JudgePanel() {
  return (
    <div className="judge judge-2col">
      <div className="judge-left">
        <div>
          <div className="head" style={{ padding: '4px 0', borderBottom: 0 }}>
            <span>Score</span>
            <span className="spacer" />
            <span className="meta">weighted by tests · diff size · lint · build</span>
          </div>
          <div className="scorerow">
            <div className="score">
              <span className="who"><span className="d x" />codex</span>
              <div className="bar"><div style={{ width: '94%', background: 'var(--vf-flux-500)' }} /></div>
              <span className="val">9.4</span>
            </div>
            <div className="score">
              <span className="who"><span className="d c" />claude</span>
              <div className="bar"><div style={{ width: '76%', background: 'var(--vf-teal-400)' }} /></div>
              <span className="val">7.6</span>
            </div>
            <div className="score">
              <span className="who"><span className="d g" />gpt-5</span>
              <div className="bar"><div style={{ width: '28%', background: 'oklch(0.62 0.22 25)' }} /></div>
              <span className="val">2.8</span>
            </div>
          </div>
        </div>

        <div>
          <div className="head" style={{ padding: '4px 0', borderBottom: 0 }}>
            <span>Checks · codex</span>
            <span className="spacer" />
          </div>
          <div className="checks">
            <div className="check"><span className="ic ok">{I.check}</span><span className="lbl">vitest src/billing</span><span className="meta">48/48 · 0.6s</span></div>
            <div className="check"><span className="ic ok">{I.check}</span><span className="lbl">eslint src/</span><span className="meta">0 issues</span></div>
            <div className="check"><span className="ic ok">{I.check}</span><span className="lbl">tsc --noEmit</span><span className="meta">0 errors</span></div>
            <div className="check"><span className="ic ok">{I.check}</span><span className="lbl">vite build</span><span className="meta">ok 4.2s</span></div>
            <div className="check"><span className="ic run">{I.spinner}</span><span className="lbl">e2e · onboarding</span><span className="meta">running…</span></div>
          </div>
        </div>
      </div>

      <div className="verdict">
        <span className="eyebrow">Verdict · ⌘ to promote</span>
        <div className="headline">Promote <b>codex.</b></div>
        <div className="body">
          48/48 tests pass, fewest files touched, cleanest diff. claude is 80% there but still wiring its hook.
        </div>
        <div className="row">
          <button className="btn flux">{I.bolt} Promote → main</button>
          <button className="btn ghost">Open in editor</button>
        </div>
      </div>
    </div>
  );
}
