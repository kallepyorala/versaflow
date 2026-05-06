import type { TickerEvent } from '@/types';

export const BASE_TICKER: TickerEvent[] = [
  { kind: 'now',    t: '14:04', iss: 'VF-1284', l: <><span className="agent">claude</span> running <span className="mono">vitest src/billing</span></> },
  { kind: 'ok',     t: '14:04', iss: 'VF-1290', l: <><span className="x">codex</span> opened PR — <b>onboarding invites</b></> },
  { kind: 'ok',     t: '14:03', iss: 'VF-1284', l: <><span className="agent">claude</span> committed <b>a3f7c12</b></> },
  { kind: 'ok',     t: '14:02', iss: 'VF-1284', l: <><span className="x">codex</span> finished — <b>48/48</b> tests pass · <span className="mute">leader</span></> },
  { kind: 'tealed', t: '14:01', iss: 'VF-1276', l: <><span className="agent">claude</span> reproduced flake — <span className="mono">webhook.test.ts:142</span></> },
  { kind: 'fail',   t: '14:01', iss: 'VF-1284', l: <><span style={{ color: 'oklch(0.78 0.18 25)' }}>gpt-5</span> tests <b>31/35</b> ✗ rolled back</> },
  { kind: 'tealed', t: '14:01', iss: 'VF-1284', l: <><span className="x">codex</span> ran <span className="mono">build</span> · ok 4.2s</> },
  { kind: 'tealed', t: '14:00', iss: 'VF-1290', l: <><span className="agent">claude</span> edited <span className="mono">CheckoutForm.tsx</span></> },
  { kind: 'tealed', t: '14:00', iss: 'VF-1284', l: <><span className="mute">3 agents started on </span><b>VF-1284</b></> },
  { kind: 'ok',     t: '13:58', iss: 'VF-1268', l: <><span className="x">codex</span> shipped trial banner copy — <span className="mute">approved</span></> },
  { kind: 'ok',     t: '13:58', iss: 'VF-1284', l: <>Pulled latest <b>main</b> · <span className="mute">clean</span></> },
];

export const LIVE_EVENTS: TickerEvent[] = [
  { kind: 'tealed', t: '14:04', iss: 'VF-1284', l: <><span className="agent">claude</span> edited <span className="mono">useBilling.ts</span> <span className="mute">+18 −12</span></> },
  { kind: 'ok',     t: '14:04', iss: 'VF-1284', l: <><span className="agent">claude</span> tests <b>42/42</b> ✓</> },
  { kind: 'tealed', t: '14:05', iss: 'VF-1284', l: <><span className="x">codex</span> ran <span className="mono">eslint src/</span> · <span className="mute">0 issues</span></> },
  { kind: 'now',    t: '14:05', iss: 'VF-1284', l: <><span className="agent">claude</span> wiring <span className="mono">useBilling()</span></> },
  { kind: 'ok',     t: '14:05', iss: 'VF-1284', l: <>build <b>ok</b> 4.2s</> },
];
