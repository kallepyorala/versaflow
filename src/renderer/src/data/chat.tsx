import type { ChatThread, AgentColor } from '@/types';
import { Toolcall } from '@/components/chat/Toolcall';
import { PermissionRequest } from '@/components/chat/PermissionRequest';

export const CHAT_BY_AGENT: Record<AgentColor, ChatThread> = {
  c: {
    name: 'claude', model: 'sonnet-4.5', color: 'c', time: '14:02',
    streaming: true, status: 'streaming',
    turns: [
      { who: 'user', name: 'Erik', time: '14:02', body: <p>Refactor the billing reducer to use the new <code>useReducer</code> pattern. Don't touch <code>__snapshots__</code>. Run <code>vitest</code> before you finish.</p> },
      { who: 'agent', name: 'claude', model: 'sonnet-4.5 · 14:02',
        body: <>
          <p>Reading the current reducer first.</p>
          <Toolcall name="read_file" arg={<>src/billing/<b>reducer.ts</b></>} result="184L"/>
          <p style={{ marginTop: 8 }}>Splitting into a slice-style reducer. Three cases plus a default. The legacy <code>PATCH</code> action becomes a derived helper.</p>
          <Toolcall name="edit_file" arg={<>src/billing/<b>reducer.ts</b></>} result="+84 −37" defaultOpen={true}>
            <span className="add">{`+  switch (action.type) {`}</span>{'\n'}
            <span className="add">{`+    case 'SET_PLAN':     return { ...state, plan: action.plan };`}</span>{'\n'}
            <span className="add">{`+    case 'UPDATE_SEATS': return { ...state, seats: action.seats };`}</span>{'\n'}
            <span className="add">{`+    case 'RESET':        return initialBillingState;`}</span>{'\n'}
            <span className="add">{`+  }`}</span>
          </Toolcall>
          <PermissionRequest verb="Edit" path={{ prefix: '/Users/kalle/Projects/Scaleup/nume-versaflow/worktrees/AIC-2801/', name: 'useBilling.ts' }}/>
        </>,
      },
      {
        who: 'agent', name: 'claude', model: 'sonnet-4.5 · 14:04', streaming: true,
        body: <p>Now wiring <code>useBilling()</code> and updating the three call sites in checkout. Tests after.<span style={{ display: 'inline-block', width: 1, height: 13, background: 'var(--primary)', verticalAlign: -2, marginLeft: 2, animation: 'blink 1s steps(2,end) infinite' }}/></p>,
      },
    ],
  },
  x: {
    name: 'codex', model: '1.5-pro', color: 'x', time: '14:00', winner: true, status: 'won',
    turns: [
      { who: 'user', name: 'Erik', time: '14:00', body: <p>Refactor the billing reducer to use the new <code>useReducer</code> pattern. Don't touch <code>__snapshots__</code>. Run <code>vitest</code> before you finish.</p> },
      {
        who: 'agent', name: 'codex', model: '1.5-pro · 14:00',
        body: <>
          <p>I'll plan first, then split actions, then run tests.</p>
          <div className="toolcall"><div className="th"><span className="name">plan</span><span className="arg">split into <b>slice actions</b> · 3 + default</span><span className="ok">✓</span></div></div>
          <div className="toolcall"><div className="th"><span className="name">edit_file</span><span className="arg">src/billing/<b>reducer.ts</b></span><span className="ok">✓ +71 −37</span></div></div>
          <div className="toolcall"><div className="th"><span className="name">vitest</span><span className="arg">src/billing</span><span className="ok">✓ 48/48</span></div></div>
          <p style={{ marginTop: 8 }}>All green. <code>build</code> ok in 4.2s. Ready to promote.</p>
        </>,
      },
    ],
  },
  g: {
    name: 'gpt-5', model: 'thinking-1', color: 'g', time: '14:00', errored: true, status: 'errored',
    turns: [
      { who: 'user', name: 'Erik', time: '14:00', body: <p>Refactor the billing reducer to use the new <code>useReducer</code> pattern…</p> },
      {
        who: 'agent', name: 'gpt-5', model: 'thinking-1 · 14:01',
        body: <>
          <p>Rewriting the reducer with explicit cases.</p>
          <div className="toolcall"><div className="th"><span className="name">edit_file</span><span className="arg">src/billing/<b>reducer.ts</b></span><span className="ok">✓ +44 −32</span></div></div>
          <div className="toolcall"><div className="th"><span className="name">vitest</span><span className="arg">src/billing</span><span className="fail">✗ 31/35</span></div></div>
          <p style={{ marginTop: 8, color: 'oklch(0.78 0.18 25)' }}>4 tests failing. Rolling back and exiting.</p>
        </>,
      },
    ],
  },
};

export const MODE_OPTIONS = [
  { id: 'default', name: 'Default',          desc: 'Ask before edits, explain steps.',     dot: '' },
  { id: 'auto',    name: 'Auto',             desc: 'Edit and run tools without asking.',   dot: '' },
  { id: 'plan',    name: 'Plan',             desc: 'Read-only — propose a plan, no edits.', dot: 'warn' },
  { id: 'yolo',    name: 'Dangerously skip', desc: 'Skip all permission prompts.',         dot: 'danger', danger: true },
];

export const MODEL_OPTIONS = [
  { id: 'opus-4.7',   name: 'opus-4.7',   desc: 'Strongest reasoning. Slow, expensive.', dot: 'flux' },
  { id: 'sonnet-4.6', name: 'sonnet-4.6', desc: 'Balanced — default for coding.',       dot: '' },
  { id: 'haiku-4.5',  name: 'haiku-4.5',  desc: 'Fast and cheap. Good for tape work.',  dot: '' },
];

export const EFFORT_OPTIONS = [
  { id: 'low',     name: 'Low',        bars: 1, desc: 'Fast, shallow.' },
  { id: 'medium',  name: 'Medium',     bars: 2, desc: 'Balanced.' },
  { id: 'high',    name: 'High',       bars: 3, desc: 'More tool calls, deeper passes.' },
  { id: 'xhigh',   name: 'Extra high', bars: 4, desc: 'Long horizon, many revisions.' },
  { id: 'max',     name: 'Max',        bars: 5, desc: 'Burn budget — exhaustive.', max: true },
];
