export function OverviewEmpty() {
  return (
    <div className="ov-shell ov-empty-shell">
      <div className="ov-main">
        <header className="ov-head">
          <div className="ov-title-block">
            <div className="ov-title">Overview</div>
            <div className="ov-meta">
              <span><b>VF-1284</b></span>
              <span className="sep">·</span>
              <span>no worktree yet</span>
            </div>
          </div>
        </header>

        <div className="ov-doc">
          <div className="ov-empty">
            <div className="ov-empty-art" aria-hidden="true">
              <svg viewBox="0 0 120 120" fill="none">
                <defs>
                  <pattern id="oeGrid" width="12" height="12" patternUnits="userSpaceOnUse">
                    <path d="M12 0H0v12" stroke="var(--vf-ink-800)" strokeWidth="1" fill="none" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="120" height="120" fill="url(#oeGrid)" />
                <g transform="translate(60 62)">
                  <circle r="6" fill="var(--vf-flux-500)" opacity="0.18" />
                  <circle r="3" fill="var(--vf-flux-400)" />
                  <line x1="0" y1="0" x2="-26" y2="-22" stroke="var(--vf-teal-400)" strokeWidth="1.5" />
                  <circle cx="-26" cy="-22" r="4" fill="var(--vf-ink-900)" stroke="var(--vf-teal-300)" strokeWidth="1.5" />
                  <text x="-32" y="-26" fontSize="7" fill="var(--vf-teal-300)" fontFamily="var(--font-mono)" textAnchor="end" letterSpacing="0.04em">main</text>
                  <line x1="0" y1="0" x2="32" y2="20" stroke="var(--vf-ink-650)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="32" cy="20" r="6" fill="var(--vf-ink-900)" stroke="var(--vf-ink-650)" strokeWidth="1.5" strokeDasharray="2 2" />
                  <text x="38" y="24" fontSize="7" fill="var(--vf-ink-600)" fontFamily="var(--font-mono)" letterSpacing="0.04em">?</text>
                </g>
              </svg>
            </div>

            <div className="ov-empty-eyebrow">VF-1284 · No worktree yet</div>
            <h1 className="ov-empty-h1">Spin up a worktree to start.</h1>
            <p className="ov-empty-sub">
              Once you create a worktree, agents can race this issue, you'll get a <code>diff</code>, a <code>compare</code> view, and chat tabs land here. Until then, the issue lives in Linear and this surface stays quiet.
            </p>

            <div className="ov-empty-card">
              <div className="ov-empty-card-row">
                <div className="ov-empty-card-lab">Repo</div>
                <div className="ov-empty-card-val">
                  <span className="iv-tag">acme-co / billing</span>
                </div>
              </div>
              <div className="ov-empty-card-row">
                <div className="ov-empty-card-lab">Base branch</div>
                <div className="ov-empty-card-val">
                  <span className="mono teal">main</span>
                  <span className="dim">@</span>
                  <span className="mono">a3f7c12</span>
                </div>
              </div>
              <div className="ov-empty-card-row">
                <div className="ov-empty-card-lab">Worktree branch</div>
                <div className="ov-empty-card-val">
                  <input className="ov-empty-input" defaultValue="vf-1284-refactor-billing-reducer" spellCheck={false} />
                </div>
              </div>
              <div className="ov-empty-card-row">
                <div className="ov-empty-card-lab">Worktree path</div>
                <div className="ov-empty-card-val">
                  <span className="mono dim">~/Projects/acme/worktrees/</span>
                  <span className="mono">vf-1284-refactor-billing-reducer</span>
                </div>
              </div>
              <div className="ov-empty-card-row">
                <div className="ov-empty-card-lab">Setup</div>
                <div className="ov-empty-card-val">
                  <span className="mono dim">$</span>
                  <span className="mono">pnpm install</span>
                  <span className="dim">·</span>
                  <span className="mono dim">runs once after checkout</span>
                </div>
              </div>
            </div>

            <div className="ov-empty-actions">
              <button className="ov-btn primary ov-empty-cta" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>Add worktree</span>
                <span className="kbd">⌘W</span>
              </button>
              <button className="ov-btn" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 4h6v6" />
                  <path d="M10 14 21 3" />
                  <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
                </svg>
                <span>Open in Linear</span>
              </button>
            </div>

            <div className="ov-empty-hints">
              <div className="ov-empty-hint">
                <span className="ic">⏱</span>
                <div>
                  <div className="lab">Takes ~6s</div>
                  <div className="sub">Detached worktree off <span className="mono teal">main@a3f7c12</span> · runs <span className="mono">pnpm install</span></div>
                </div>
              </div>
              <div className="ov-empty-hint">
                <span className="ic">⤴</span>
                <div>
                  <div className="lab">Reversible</div>
                  <div className="sub">Discard from the worktree menu — no commits land on <span className="mono teal">main</span> until you open a PR.</div>
                </div>
              </div>
              <div className="ov-empty-hint">
                <span className="ic">∞</span>
                <div>
                  <div className="lab">One worktree, many agents</div>
                  <div className="sub">Race claude, codex and gpt-5 in parallel — they each get an isolated copy.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
