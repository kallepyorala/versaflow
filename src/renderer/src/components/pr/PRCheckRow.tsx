import { useState } from 'react';
import type { PRCheck } from '@/data/pr';
import {
  PR_ICON_RERUN, PR_ICON_CANCEL, PR_ICON_OUT, PR_ICON_AGENT, PR_ICON_LOG,
} from '@/icons';
import { PRStateIcon } from './PRStateIcon';

const stateLabels: Record<PRCheck['state'], string> = {
  pass: 'Passed', fail: 'Failed', run: 'Running', skip: 'Skipped', queued: 'Queued',
};

export function PRCheckRow({ check }: { check: PRCheck }) {
  const [expanded, setExpanded] = useState(check.state === 'fail' && check.name === 'unit / billing');
  const stateLabel = stateLabels[check.state] || check.state;
  return (
    <div
      className={`pr-check-row ${check.state === 'fail' ? 'failed' : ''} ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded((v) => !v)}
    >
      <PRStateIcon state={check.state} />
      <div className="pr-check-info">
        <div className="pr-check-name">{check.name}</div>
        <div className="pr-check-meta">
          <span className="src">{check.src}</span>
          {check.dur && <span className="dur">{check.dur}</span>}
          {check.state === 'queued' && <span>queued</span>}
          {check.state === 'run' && <span>running…</span>}
          {check.state === 'fail' && <span className="err">{stateLabel}</span>}
        </div>
      </div>
      <div className="pr-check-actions" onClick={(e) => e.stopPropagation()}>
        {(check.state === 'fail' || check.state === 'pass') && (
          <button className="ico" title="Re-run">{PR_ICON_RERUN}</button>
        )}
        {check.state === 'run' && (
          <button className="ico danger" title="Cancel">{PR_ICON_CANCEL}</button>
        )}
        <button className="ico" title="Open logs">{PR_ICON_OUT}</button>
      </div>
      {expanded && check.state === 'fail' && check.err && (
        <div className="pr-check-detail">
          <div className="err-line">{check.err}</div>
          <div className="det-meta">
            <span><b>Failed step:</b> run tests</span>
            <span><b>Attempt:</b> 1 of 3</span>
            <span><b>Runner:</b> ubuntu-22.04 · 4-core</span>
          </div>
          <div className="det-actions">
            <button className="det-btn flux">{PR_ICON_AGENT}Send to claude</button>
            <button className="det-btn">{PR_ICON_RERUN}Re-run job</button>
            <button className="det-btn">{PR_ICON_LOG}Full log</button>
            <button className="det-btn">{PR_ICON_OUT}On GitHub</button>
          </div>
        </div>
      )}
    </div>
  );
}
