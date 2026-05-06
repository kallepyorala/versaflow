import { PR_CHECKS } from '@/data/pr';
import type { PRCheckState } from '@/data/pr';
import { PR_ICON_AGENT, PR_ICON_RERUN, PR_ICON_OUT } from '@/icons';
import { PRCheckRow } from './PRCheckRow';

export function PRChecksSidebar() {
  const all = [...PR_CHECKS.required, ...PR_CHECKS.optional];
  const counts = all.reduce<Partial<Record<PRCheckState, number>>>((a, c) => {
    a[c.state] = (a[c.state] || 0) + 1;
    return a;
  }, {});
  const total = all.length;
  const pass = counts.pass || 0;
  const fail = counts.fail || 0;
  const run  = counts.run  || 0;
  const skip = (counts.skip || 0) + (counts.queued || 0);
  const tone = fail ? 'fail' : run ? 'run' : 'pass';

  return (
    <div className="pr-checks">
      <div className={`pr-checks-summary ${tone}`}>
        <div className="pr-checks-eyebrow">
          <span className="live-d" />
          <span>Checks · live</span>
        </div>
        <div className="pr-checks-headline">
          {fail > 0 ? <><span className="fail-num">{fail}</span> failing</>
            : run > 0 ? <><span className="run-num">{run}</span> running</>
            : <><span className="pass-num">{pass}/{total}</span> passing</>}
        </div>
        <div className="pr-checks-sub">
          {pass} passed · {fail} failed · {run} running · {skip} skipped/queued
        </div>
        <div className="pr-checks-bar">
          {pass > 0 && <div className="seg pass" style={{ flex: pass }} />}
          {fail > 0 && <div className="seg fail" style={{ flex: fail }} />}
          {run > 0 && <div className="seg run" style={{ flex: run }} />}
          {skip > 0 && <div className="seg skip" style={{ flex: skip }} />}
        </div>
        <div className="pr-checks-actions">
          {fail > 0 && <button className="btn flux">{PR_ICON_AGENT}Send failures to claude</button>}
          <button className="btn">{PR_ICON_RERUN}Re-run failed</button>
          <button className="btn">{PR_ICON_OUT}On GitHub</button>
        </div>
      </div>

      <div className="pr-checks-list">
        <div className="pr-checks-group-h">
          <span>Required</span>
          <span className="num">{PR_CHECKS.required.length}</span>
        </div>
        {PR_CHECKS.required.map((c) => <PRCheckRow key={c.name} check={c} />)}

        <div className="pr-checks-group-h">
          <span>Optional</span>
          <span className="num">{PR_CHECKS.optional.length}</span>
        </div>
        {PR_CHECKS.optional.map((c) => <PRCheckRow key={c.name} check={c} />)}
      </div>
    </div>
  );
}
