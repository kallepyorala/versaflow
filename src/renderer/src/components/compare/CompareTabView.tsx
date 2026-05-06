import { useState } from 'react';
import type { Telemetry, Tweaks } from '@/types';
import { AGENTS } from '@/data/agents';
import { I } from '@/icons';
import { TelemetryStrip } from '@/components/layout/TelemetryStrip';
import { RaceLanes } from '@/components/race/RaceLanes';
import { JudgePanel } from './JudgePanel';
import { AgentDetail } from './AgentDetail';

interface CompareTabViewProps {
  telem: Telemetry;
  tweaks: Tweaks;
}

export function CompareTabView({ telem, tweaks }: CompareTabViewProps) {
  const [sub, setSub] = useState<string>('judge');
  const subTabs = [
    { id: 'judge', label: 'Judge', state: 'judge' as const },
    ...AGENTS.map((a) => ({ id: a.key, label: a.name, state: a.state, agent: a })),
  ];

  return (
    <>
      <TelemetryStrip telem={telem} />
      <RaceLanes tweaks={tweaks} animating={tweaks.racing} />
      <div className="cmp-subtabs" role="tablist">
        {subTabs.map((t) => {
          const active = sub === t.id;
          let badge = null;
          if (t.state === 'active')   badge = <span className="cmp-sub-badge live"><span className="d" />Live</span>;
          else if (t.state === 'leading') badge = <span className="cmp-sub-badge winner">Won</span>;
          else if (t.state === 'errored') badge = <span className="cmp-sub-badge errored">Errored</span>;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              className={`cmp-sub ${active ? 'active' : ''}`}
              onClick={() => setSub(t.id)}
              type="button"
            >
              {'agent' in t
                ? <span className={`cmp-sub-ic agent ${t.agent.color}`}>{t.agent.letter}</span>
                : <span className="cmp-sub-ic judge">{I.bolt}</span>}
              <span className="cmp-sub-lbl">{t.label}</span>
              {badge}
            </button>
          );
        })}
      </div>
      {sub === 'judge' && (
        <div className="review">
          <div className="panel" style={{ flex: 1 }}>
            <div className="head">
              <span>Judge</span>
              <span className="spacer" />
              <span className="meta">3 agents · 14:00–14:05</span>
            </div>
            <div className="body"><JudgePanel /></div>
          </div>
        </div>
      )}
      {AGENTS.map((a) => sub === a.key && <AgentDetail key={a.key} agent={a} animating={tweaks.racing} />)}
    </>
  );
}
