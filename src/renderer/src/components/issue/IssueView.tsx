import { ISSUE_COMMENTS } from '@/data/comments';
import { IssueComment } from './IssueComment';

export function IssueView() {
  return (
    <div className="ov-shell iv-shell">
      <div className="ov-main">
        <header className="ov-head">
          <div className="ov-title-block">
            <div className="ov-title">Issue</div>
            <div className="ov-meta">
              <span><b>VF-1284</b></span>
              <span className="sep">·</span>
              <span>linear · acme-co / billing</span>
              <span className="sep">·</span>
              <span>opened <b>3d ago</b> by Maya Chen</span>
              <span className="sep">·</span>
              <span><b>{ISSUE_COMMENTS.length}</b> comments</span>
            </div>
          </div>
          <div className="ov-actions">
            <a className="ov-btn" href="#" target="_blank" rel="noreferrer" title="Open in Linear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4h6v6" />
                <path d="M10 14 21 3" />
                <path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" />
              </svg>
              <span>Open in Linear</span>
            </a>
            <button className="ov-btn" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
              <span>Copy ID</span>
            </button>
          </div>
        </header>

        <div className="ov-doc">
          <div className="ov-doc-inner">
            <div className="ov-eyebrow">
              <span className="iv-id-pill">VF-1284</span>
              <span className="dim">/</span>
              <span>imported from Linear · 13:58</span>
            </div>

            <h1
              className="ov-h1"
              style={{ fontStyle: 'normal', fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.018em', marginBottom: 18 }}
            >
              Refactor billing reducer
            </h1>

            <div className="iv-props">
              <div className="iv-prop">
                <div className="iv-prop-lab">Status</div>
                <div className="iv-prop-val"><span className="iv-status in-progress"><span className="ring" />In Progress</span></div>
              </div>
              <div className="iv-prop">
                <div className="iv-prop-lab">Priority</div>
                <div className="iv-prop-val"><span className="iv-pri high">High</span></div>
              </div>
              <div className="iv-prop">
                <div className="iv-prop-lab">Assignee</div>
                <div className="iv-prop-val">
                  <span className="iv-asg">
                    <span className="iv-asg-av" style={{ background: 'oklch(0.74 0.16 200)' }}>x</span>
                    agent · codex
                  </span>
                </div>
              </div>
              <div className="iv-prop">
                <div className="iv-prop-lab">Reporter</div>
                <div className="iv-prop-val">
                  <span className="iv-asg">
                    <span className="iv-asg-av" style={{ background: 'oklch(0.72 0.16 290)' }}>MC</span>
                    Maya Chen
                  </span>
                </div>
              </div>
              <div className="iv-prop">
                <div className="iv-prop-lab">Project</div>
                <div className="iv-prop-val">
                  <span className="iv-tag">
                    <span className="dot" style={{ background: 'var(--vf-flux-400)' }} />
                    Billing rework Q2
                  </span>
                </div>
              </div>
              <div className="iv-prop">
                <div className="iv-prop-lab">Cycle</div>
                <div className="iv-prop-val"><span className="iv-tag">Cycle 41 · 4d left</span></div>
              </div>
              <div className="iv-prop">
                <div className="iv-prop-lab">Estimate</div>
                <div className="iv-prop-val"><span className="iv-tag">3 pts</span></div>
              </div>
              <div className="iv-prop">
                <div className="iv-prop-lab">Labels</div>
                <div className="iv-prop-val iv-labels">
                  <span className="iv-label" style={{ ['--lc' as string]: 'oklch(0.72 0.16 200)' } as React.CSSProperties}>refactor</span>
                  <span className="iv-label" style={{ ['--lc' as string]: 'oklch(0.78 0.16 75)' } as React.CSSProperties}>billing</span>
                  <span className="iv-label" style={{ ['--lc' as string]: 'oklch(0.74 0.13 175)' } as React.CSSProperties}>tech-debt</span>
                </div>
              </div>
            </div>

            <p className="ov-lede">
              The legacy <code>PATCH</code> action in <code>src/billing/reducer.ts</code> mutates state opaquely and makes seat-update bugs hard to trace. Replace it with explicit slice actions and a derived selector.
            </p>

            <h2 className="ov-h2">Context</h2>
            <p className="ov-p">
              We've shipped three patches this quarter that all bottomed out at the same place: a <code>PATCH</code> dispatch with a partial payload silently overwriting fields that shouldn't have changed. The reducer can't distinguish between "I only meant to update seats" and "set the entire state to this." That ambiguity is the bug.
            </p>
            <p className="ov-p">
              The fix is mechanical but invasive: replace the single action with three discriminated cases and update every dispatch site. The action shape change is a breaking internal API — no external contract is affected.
            </p>

            <h2 className="ov-h2">Acceptance</h2>
            <ul className="md-ul">
              <li>Three explicit actions: <code>SET_PLAN</code>, <code>UPDATE_SEATS</code>, <code>RESET</code>.</li>
              <li>Reducer has an exhaustive default branch that throws on unknown <code>kind</code>.</li>
              <li>All existing tests pass without modifying <code>__snapshots__</code>.</li>
              <li><code>vitest src/billing</code> green before opening PR.</li>
              <li>Type checks clean: <code>tsc --noEmit</code>.</li>
            </ul>

            <h2 className="ov-h2">Out of scope</h2>
            <ul className="md-ul">
              <li>Migration of the persisted billing snapshot format.</li>
              <li>Changes to the Stripe webhook handlers.</li>
              <li>iOS client v3.4 column-rename compatibility (separate ticket).</li>
            </ul>

            <h2 className="ov-h2">Linked</h2>
            <ul className="md-ul">
              <li><a className="ov-link" href="#"><b>VF-1276</b></a> — flaky webhook retry test (separate work)</li>
              <li><a className="ov-link" href="#"><b>VF-1268</b></a> — trial banner copy (done)</li>
              <li><a className="ov-link" href="#"><b>VF-1290</b></a> — add team invites to onboarding (parallel)</li>
            </ul>

            <h2 className="ov-h2">Activity</h2>
            <ul className="iv-activity">
              <li><span className="t">3d ago</span><span className="a"><b>Maya Chen</b> created the issue and set priority <b>High</b></span></li>
              <li>
                <span className="t">3d ago</span>
                <span className="a">
                  <b>Maya Chen</b> added labels{' '}
                  <span className="iv-label" style={{ ['--lc' as string]: 'oklch(0.72 0.16 200)' } as React.CSSProperties}>refactor</span>{' '}
                  <span className="iv-label" style={{ ['--lc' as string]: 'oklch(0.78 0.16 75)' } as React.CSSProperties}>billing</span>
                </span>
              </li>
              <li><span className="t">2d ago</span><span className="a"><b>Devon Park</b> moved this from <span className="mono">Triage</span> to <span className="mono">Backlog</span></span></li>
              <li><span className="t">14:00</span><span className="a"><b>cockpit</b> dispatched <b>3 agents</b> · <span className="mono">claude · codex · gpt-5</span></span></li>
              <li><span className="t">14:00</span><span className="a">Status changed <span className="mono">Backlog</span> → <span className="mono">In Progress</span></span></li>
              <li><span className="t">14:02</span><span className="a"><b>codex</b> assigned itself</span></li>
            </ul>

            <h2 className="ov-h2">Comments · {ISSUE_COMMENTS.length}</h2>
            <div className="iv-comments">
              {ISSUE_COMMENTS.map((c, i) => (
                <IssueComment key={c.id} c={c} isLast={i === ISSUE_COMMENTS.length - 1} />
              ))}
            </div>

            <div className="iv-composer">
              <div className="iv-cmt-rail">
                <div className="iv-av" style={{ background: 'var(--vf-ink-700)' }} aria-hidden="true">
                  <span>You</span>
                </div>
              </div>
              <div className="iv-composer-box">
                <textarea placeholder="Leave a comment… markdown supported" rows={3} />
                <div className="iv-composer-foot">
                  <span className="iv-composer-hint">⌘↵ to send</span>
                  <span className="spacer" />
                  <button className="ov-btn" type="button">Cancel</button>
                  <button className="ov-btn primary" type="button">Comment</button>
                </div>
              </div>
            </div>

            <p className="ov-p" style={{ marginTop: 32, color: 'var(--vf-ink-600)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em' }}>
                END · VF-1284 · synced from linear 14:08
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
