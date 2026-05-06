import type { Telemetry } from '@/types';
import { I } from '@/icons';

export function TelemetryStrip({ telem }: { telem: Telemetry }) {
  return (
    <div className="telem">
      <div className="cell">
        <div>
          <div className="lbl">Tests passing</div>
          <div className="val">
            <span style={{ color: 'var(--success)' }}>{telem.ok}</span>
            <span style={{ color: 'var(--muted-foreground)' }}> / </span>
            <span style={{ color: 'oklch(0.78 0.18 25)' }}>{telem.fail}</span>
          </div>
        </div>
      </div>
      <div className="cell opt-1300">
        <div>
          <div className="lbl">tok/s aggregate</div>
          <div className="val">{telem.tps.toFixed(0)} <span className="delta">▲ 12%</span></div>
        </div>
      </div>
      <div className="cell">
        <div>
          <div className="lbl">Wall clock</div>
          <div className="val serif">04:08</div>
        </div>
      </div>
      <div className="cell grow opt-1500" style={{ minWidth: 0, overflow: 'hidden' }}>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div className="lbl">Pulse · last 60s</div>
          <div className="sparkrow" style={{ marginTop: 4 }}>
            {telem.spark.map((h, i) => (
              <span key={i} className={h > 14 ? 'hi' : ''} style={{ height: h + 'px' }} />
            ))}
          </div>
        </div>
      </div>
      <div className="cell" style={{ marginLeft: 'auto' }}>
        <button className="btn flux" style={{ height: 30, padding: '0 12px' }}>
          {I.bolt} Promote codex{' '}
          <span className="kbd" style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, opacity: 0.75 }}>⌘↵</span>
        </button>
      </div>
    </div>
  );
}
