import { useState } from 'react';
import type { AgentColor } from '@/types';
import { CHAT_BY_AGENT, MODE_OPTIONS, MODEL_OPTIONS, EFFORT_OPTIONS } from '@/data/chat';
import { MenuPill } from './MenuPill';

export function ChatView({ agentKey }: { agentKey: AgentColor }) {
  const c = CHAT_BY_AGENT[agentKey];
  const [mode, setMode] = useState('default');
  const [effort, setEffort] = useState('medium');
  const [model, setModel] = useState('sonnet-4.6');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div className="chat-view" style={{ flex: 1, overflow: 'auto' }}>
        {c.turns.map((t, i) => (
          <div key={i} className={`turn ${t.who === 'user' ? 'user' : c.color}`}>
            <div className="av">{t.who === 'user' ? 'EH' : c.name[0].toUpperCase()}</div>
            <div>
              <div className="who">
                <b>{t.name}</b>
                {t.model && <span className="meta">{t.model}</span>}
                {t.streaming && <span className="stream">streaming…</span>}
              </div>
              <div className="body">{t.body}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="composer-mini">
        <div className="box">
          <div className="ph">
            Reply to {c.name}, paste a stack trace, or @another agent…<span className="caret" />
          </div>
          <div className="row">
            <span className="ctx-pill on">@{c.name}</span>
            <MenuPill
              keyLabel="model"
              value={model}
              tone={model === 'opus-4.7' ? 'flux' : 'teal'}
              options={MODEL_OPTIONS}
              kind="mode"
              onChange={setModel}
            />
            <MenuPill
              keyLabel="mode"
              value={mode}
              tone={mode === 'yolo' ? 'flux' : (mode === 'plan' ? 'teal' : undefined)}
              options={MODE_OPTIONS}
              kind="mode"
              onChange={setMode}
            />
            <MenuPill
              keyLabel="effort"
              value={effort}
              tone={effort === 'max' || effort === 'xhigh' ? 'flux' : 'teal'}
              options={EFFORT_OPTIONS}
              kind="effort"
              onChange={setEffort}
            />
            <span className="ctx-pill">+ context</span>
            <button
              className="btn primary send"
              style={{ height: 26, fontSize: 11.5 }}
            >
              Send <span style={{ opacity: 0.7, fontFamily: 'var(--font-mono)', fontSize: 10.5, marginLeft: 3 }}>⌘↵</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
