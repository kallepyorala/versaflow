import type { TickerEvent } from '@/types';

export function ActivityFeed({ ticker, height }: { ticker: TickerEvent[]; height?: number }) {
  return (
    <div className="side-activity" style={height ? { flex: '0 0 auto', height } : undefined}>
      <div className="side-h">
        <span>Activity</span>
        <span className="side-h-stat"><span className="d" />live</span>
      </div>
      <div className="side-ticker">
        {ticker.map((ev, i) => (
          <div key={ev.key || i} className={`sev ${ev.kind} ${ev.fresh ? 'fresh' : ''}`}>
            <span className="t">{ev.t}</span>
            {ev.iss
              ? <span className="iss" title={ev.iss}>{ev.iss}</span>
              : <span className="iss none">—</span>}
            <span className="l">{ev.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
