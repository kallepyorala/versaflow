export function PreviewView() {
  return (
    <div className="ov-shell ov-empty-shell">
      <div className="ov-main">
        <header className="ov-head">
          <div className="ov-title-block">
            <div className="ov-title">Preview</div>
            <div className="ov-meta">
              <span><b>VF-1284</b></span>
              <span className="sep">·</span>
              <span>runtime not attached</span>
            </div>
          </div>
        </header>

        <div className="ov-doc">
          <div className="ov-empty">
            <div className="ov-empty-art" aria-hidden="true">
              <svg viewBox="0 0 120 120" fill="none">
                <defs>
                  <pattern id="pvGrid" width="12" height="12" patternUnits="userSpaceOnUse">
                    <path d="M12 0H0v12" stroke="var(--vf-ink-800)" strokeWidth="1" fill="none" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="120" height="120" fill="url(#pvGrid)" />
                <g transform="translate(60 60)">
                  <rect x="-32" y="-22" width="64" height="44" rx="3" fill="var(--vf-ink-900)" stroke="var(--vf-ink-650)" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="-26" cy="-16" r="1.4" fill="var(--vf-ink-650)" />
                  <circle cx="-22" cy="-16" r="1.4" fill="var(--vf-ink-650)" />
                  <circle cx="-18" cy="-16" r="1.4" fill="var(--vf-ink-650)" />
                  <path d="M-6 -2l12 6-12 6z" fill="var(--vf-teal-300)" opacity="0.5" />
                </g>
              </svg>
            </div>

            <div className="ov-empty-eyebrow">Preview · Not yet wired</div>
            <h1 className="ov-empty-h1">Live runtime preview lands later.</h1>
            <p className="ov-empty-sub">
              This pane will host a <code>WebContentsView</code> pointed at the worktree's dev server — observable by both you and the agents (console / network / DOM / CDP). Until the sidecar plumbing lands, it stays quiet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
