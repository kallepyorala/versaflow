import type { Tweaks } from '@/types';
import { AGENTS } from '@/data/agents';
import { Lane } from './Lane';

export function RaceLanes({ tweaks: _tweaks, animating }: { tweaks: Tweaks; animating: boolean }) {
  return (
    <div className="lanes">
      <div className="lanes-h">
        <span className="label">Race · 3 agents</span>
        <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: 0.04 }}>
          started 14:00 · acme-web@<span style={{ color: 'var(--vf-teal-300)' }}>main</span>
        </span>
        <span className="leader-name">Leader: <b>codex.</b></span>
      </div>
      {AGENTS.map((a) => <Lane key={a.key} agent={a} animating={animating} />)}
    </div>
  );
}
