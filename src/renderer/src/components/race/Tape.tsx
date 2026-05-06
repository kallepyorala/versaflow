import type { Agent } from '@/types';

export function Tape({ agent, animating }: { agent: Agent; animating: boolean }) {
  const items = agent.feed;
  return (
    <div className="tape">
      <div
        className="scroll"
        style={{
          animation: agent.state === 'active' && animating ? 'tape-scroll 30s linear infinite' : 'none',
        }}
      >
        {items.map((ev, i) => (
          <span
            key={i}
            className={`ev ${i === items.length - 1 && agent.state === 'active' ? 'now' : ''}`}
          >
            <span className="tn">{ev.tn}</span>
            <span className="ag">(</span>
            <span className="arg">{ev.arg}</span>
            <span className="ag">)</span>
            {ev.ok && <span className="ok">{ev.ok}</span>}
            {ev.fail && <span className="fail">{ev.fail}</span>}
            {i < items.length - 1 && <span className="sep">›</span>}
          </span>
        ))}
        {agent.typing && (
          <span className="typing">
            <span>›</span>
            <span style={{ color: 'var(--vf-teal-300)' }}>{agent.typing}</span>
            <span className="caret" />
          </span>
        )}
      </div>
    </div>
  );
}
