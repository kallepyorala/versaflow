import { useEffect, useState } from 'react';
import { OV_COMMENTS } from '@/data/comments';
import { useZen } from '@/context/zen';
import { ICON_OV_REGEN, ICON_OV_SEND } from '@/icons';
import { Concern } from './Concern';
import { DiffHunk } from './DiffHunk';
import { MigrationNote } from './MigrationNote';
import { NewDependency } from './NewDependency';
import { CommentsRail } from './CommentsRail';
import { OverviewEmpty } from './OverviewEmpty';

export function OverviewView({ hasWorktree = true }: { hasWorktree?: boolean }) {
  const zen = useZen();
  const [commentsCollapsed, setCommentsCollapsed] = useState(true);
  useEffect(() => { if (zen) setCommentsCollapsed(true); }, [zen]);

  if (!hasWorktree) return <OverviewEmpty />;

  const openCount = OV_COMMENTS.filter((c) => c.status === 'open' || c.status === 'stale').length;

  return (
    <div className="ov-shell">
      <div className="ov-main">
        <header className="ov-head">
          <div className="ov-title-block">
            <div className="ov-title">Overview</div>
            <div className="ov-meta">
              <span><b>VF-1284</b></span>
              <span className="sep">·</span>
              <span>codex@<b>4f3a92e</b></span>
              <span className="sep">·</span>
              <span><b>+71 −37</b> · 9 files</span>
              <span className="sep">·</span>
              <span><b>{openCount}</b> open comments</span>
            </div>
          </div>
          <div className="ov-actions">
            <button className="ov-btn" type="button" title="Regenerate (10–30s)">
              {ICON_OV_REGEN}
              <span>Regenerate</span>
            </button>
            <button className="ov-btn primary" type="button">
              {ICON_OV_SEND}
              <span>Send to agent</span>
              <span className="pill">{openCount}</span>
            </button>
          </div>
        </header>

        <div className="ov-doc">
          <div className="ov-doc-inner">
            <div className="ov-eyebrow">
              <span className="agent">codex composed this</span>
              <span className="dim">/</span>
              <span>14:08 · 2.4s · regenerated 1×</span>
            </div>

            <h1 className="ov-h1">I split <b>PATCH</b> into three explicit reducer actions.</h1>
            <p className="ov-lede">
              The legacy <code>PATCH</code> case in <code>src/billing/reducer.ts</code> mutated state by spread. I replaced it with <code>SET_PLAN</code>, <code>UPDATE_SEATS</code>, and <code>RESET</code>, plus an exhaustive default branch — so misrouted actions throw instead of silently no-op'ing. There's one schema rename and one new dependency you should weigh in on.
            </p>

            <div className="ov-tldr">
              <div className="ov-tldr-cell">
                <div className="ov-tldr-lab">Diff</div>
                <div className="ov-tldr-val"><span className="pos">+71</span> <span className="neg">−37</span></div>
                <div className="ov-tldr-sub">9 files · 4 hunks</div>
              </div>
              <div className="ov-tldr-cell">
                <div className="ov-tldr-lab">Tests</div>
                <div className="ov-tldr-val">48 / 48</div>
                <div className="ov-tldr-sub">vitest · 0.6s</div>
              </div>
              <div className="ov-tldr-cell">
                <div className="ov-tldr-lab">Migrations</div>
                <div className="ov-tldr-val">1</div>
                <div className="ov-tldr-sub">rename · billing</div>
              </div>
              <div className="ov-tldr-cell">
                <div className="ov-tldr-lab">New deps</div>
                <div className="ov-tldr-val">1</div>
                <div className="ov-tldr-sub">zod@3.23.8</div>
              </div>
            </div>

            <h2 className="ov-h2">What I changed</h2>
            <p className="ov-p">
              The reducer now dispatches on a <code>kind</code> discriminator and calls a small per-action handler. The two checkout call sites (<code>checkout/Plan.tsx</code> and <code>checkout/Seats.tsx</code>) were dispatching the old <code>PATCH</code> shape — I rewrote both to use the new actions and added a <code>useBilling</code> selector for the derived <code>seatCost</code> they were computing inline.
            </p>

            <DiffHunk
              file="src/billing/reducer.ts"
              range="L34–L52"
              pos={22}
              neg={9}
              defaultOpen={true}
              commentedLines={[42]}
              lines={[
                { k: 'ctx', n: 34, n0: 34, t: 'export function billingReducer(state: BillingState, a: BillingAction): BillingState {' },
                { k: 'del', n0: 35, n: null, t: "  if (a.type === 'PATCH') {" },
                { k: 'del', n0: 36, n: null, t: '    return { ...state, ...a.payload }' },
                { k: 'del', n0: 37, n: null, t: '  }' },
                { k: 'add', n0: null, n: 35, t: '  switch (a.kind) {' },
                { k: 'add', n0: null, n: 36, t: "    case 'SET_PLAN':     return setPlan(state, a)" },
                { k: 'add', n0: null, n: 37, t: "    case 'UPDATE_SEATS': return updateSeats(state, a)" },
                { k: 'add', n0: null, n: 38, t: "    case 'RESET':        return initialState" },
                { k: 'ctx', n: 39, n0: 38, t: '  }' },
                { k: 'add', n0: null, n: 40, t: '  // exhaustive — surface routing bugs early' },
                { k: 'add', n0: null, n: 41, t: '  const _exhaustive: never = a' },
                { k: 'add', n0: null, n: 42, t: '  throw new Error(`unhandled billing action: ${(a as any).kind}`)' },
                { k: 'ctx', n: 43, n0: 39, t: '}' },
              ]}
            />

            <Concern severity="warn" title="Two call sites still construct the legacy PATCH shape" anchor="checkout/Plan.tsx · L88">
              The migration script I ran caught 11 of 13 call sites. Two — <code>checkout/Plan.tsx:88</code> and <code>useBillingTrial.ts:24</code> — still hand-build a <code>PATCH</code> object before dispatching. They typecheck because of the <code>as any</code> cast on dispatch. I left them as-is for this PR; want me to follow up?
            </Concern>

            <h2 className="ov-h2">Schema</h2>
            <p className="ov-p">
              The reducer's <code>seatCount</code> field was named <code>seats</code> in the database — the mismatch was forcing a hand-mapping in <code>billing/persist.ts</code>. I renamed the column to match.
            </p>

            <MigrationNote
              table="billing_state"
              kind="rename"
              summary={<>Rename <b>seats</b> → <b>seat_count</b></>}
              before={['seats integer NOT NULL', 'DEFAULT 1']}
              after={['+ seat_count integer NOT NULL', 'DEFAULT 1', '(was: seats)']}
              notes={<><b>Reversible.</b> Migration writes both columns for one release; the read path falls back to <code>seats</code> if <code>seat_count</code> is null. Drop the old column in the next release.</>}
            />

            <Concern severity="critical" title="iOS client v3.4 reads `seats` directly via the REST adapter" anchor="schema/billing.sql · L12">
              Our REST adapter mirrors column names. v3.4 of the iOS client (installed by ~14% of users last week) reads <code>seats</code> by name and will see <code>null</code> until they update. Three options: ship the dual-write migration as planned, add a server-side alias, or block on a forced iOS update. <b>I'd recommend the alias.</b> Need a human call before merge.
            </Concern>

            <h2 className="ov-h2">Dependencies</h2>

            <NewDependency
              name="zod"
              version="3.23.8"
              reason="Validating dispatched actions at the reducer boundary so a malformed payload from a third-party integration can't ghost-mutate state."
              size="13.2 kB gz"
              license="MIT"
            />

            <h2 className="ov-h2">What I'd like a human to weigh in on</h2>
            <ul className="md-ul">
              <li>The <b>iOS column-rename</b> path — alias vs forced update.</li>
              <li>Whether the two remaining <code>PATCH</code> call sites are worth a follow-up PR or if I should fold them in here.</li>
              <li>Adding <b>zod</b> when we already use <b>yup</b> elsewhere — happy to standardise either direction.</li>
            </ul>

            <h2 className="ov-h2">Other hunks</h2>

            <DiffHunk
              file="src/billing/useBilling.ts"
              range="L12–L24"
              pos={9}
              neg={4}
              commentedLines={[18]}
              lines={[
                { k: 'ctx', n: 12, n0: 12, t: 'export function useBilling() {' },
                { k: 'del', n0: 13, n: null, t: '  const dispatch = useBillingDispatch()' },
                { k: 'add', n0: null, n: 13, t: '  const dispatch = useBillingDispatch()' },
                { k: 'add', n0: null, n: 14, t: '  const seatCost = useSeatCost()' },
                { k: 'add', n0: null, n: 18, t: "  const updateSeats = (n: number) => dispatch({ kind: 'UPDATE_SEATS', n })" },
                { k: 'ctx', n: 19, n0: 14, t: '  return { ...state, dispatch, seatCost, updateSeats }' },
                { k: 'ctx', n: 20, n0: 15, t: '}' },
              ]}
            />

            <DiffHunk
              file="src/checkout/Plan.tsx"
              range="L84–L92"
              pos={6}
              neg={4}
              lines={[
                { k: 'ctx', n: 84, n0: 84, t: '  const onPlanSelect = (id: PlanId) => {' },
                { k: 'del', n0: 85, n: null, t: "    dispatch({ type: 'PATCH', payload: { planId: id } })" },
                { k: 'add', n0: null, n: 85, t: "    dispatch({ kind: 'SET_PLAN', planId: id })" },
                { k: 'ctx', n: 86, n0: 86, t: '  }' },
              ]}
            />

            <p className="ov-p" style={{ marginTop: 24, color: 'var(--vf-ink-600)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em' }}>
                END · 4f3a92e · vf-1284-refactor-billing-reducer
              </span>
            </p>
          </div>
        </div>
      </div>

      <CommentsRail collapsed={commentsCollapsed} onToggle={() => setCommentsCollapsed((c) => !c)} />
    </div>
  );
}
