export function ReviewDoc() {
  return (
    <div className="md-view">
      <div className="md-inner">
        <div className="md-eyebrow"><span className="ic-pill">⚡</span> Verdict · auto-generated · 14:05</div>
        <h1 className="md-h1">Promote <b>codex.</b></h1>
        <p className="md-lede">
          Three agents raced VF-1284. codex finished cleanest at 04:08 with 48/48 tests passing and the smallest diff.
        </p>
        <div className="md-meta">
          <span>Issue <b>VF-1284</b></span>
          <span>Winner <b style={{ color: 'var(--vf-flux-400)' }}>codex</b></span>
          <span>Tests <b>48/48</b></span>
          <span>Wall <b>04:08</b></span>
        </div>
        <h2 className="md-h2">What codex did</h2>
        <p className="md-p">
          Split the legacy <code>PATCH</code> action into three explicit slice cases (<code>SET_PLAN</code>, <code>UPDATE_SEATS</code>, <code>RESET</code>) and added a default branch. Updated <code>useBilling.ts</code> and the two checkout call sites. Total +71 −37 across 9 files.
        </p>
        <h2 className="md-h2">Why claude is behind</h2>
        <p className="md-p">
          claude wrote a similar reducer change but is still wiring its <code>useBilling</code> hook into the checkout flow. Tests pass on what it has so far; not done yet.
        </p>
        <h2 className="md-h2">Why gpt-5 errored</h2>
        <p className="md-p">
          gpt-5 missed the <code>RESET</code> path and 4 tests failed after its first edit. It rolled back and exited at 03:22.
        </p>
        <div className="md-callout">
          <b>Recommendation</b>
          Promote codex to <code>main</code>. Its diff is the smallest, all checks are green, and the plan it wrote is reusable as the canonical reducer pattern.
        </div>
        <h2 className="md-h2">Checks</h2>
        <ul className="md-ul">
          <li><code>vitest src/billing</code> — 48/48 pass · 0.6s</li>
          <li><code>eslint src/</code> — 0 issues</li>
          <li><code>tsc --noEmit</code> — 0 errors</li>
          <li><code>vite build</code> — ok 4.2s</li>
          <li><code>e2e · onboarding</code> — running…</li>
        </ul>
      </div>
    </div>
  );
}
