import type { Agent } from '@/types';
import { Tape } from './Tape';
import { I } from '@/icons';

export function Lane({ agent, animating }: { agent: Agent; animating: boolean }) {
  return (
    <div className={`lane ${agent.state}`}>
      {agent.state === 'leading' && (
        <span className="lead-pill">{I.bolt} Leading</span>
      )}
      <div className="who">
        <div className="row1">
          <span className={`a-badge ${agent.color}`}>{agent.letter}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <span className="name">{agent.name}</span>
            <span className="model">{agent.model}</span>
          </div>
        </div>
        <div className="status-row">
          <span
            className={`dot ${
              agent.state === 'leading' ? 'flux'
              : agent.state === 'errored' ? 'err'
              : agent.color === 'g' ? 'gpt' : ''
            }`}
          />
          <span>
            {agent.state === 'errored' ? 'errored'
            : agent.state === 'leading' ? 'won'
            : 'running'}
          </span>
          <span style={{ color: 'var(--vf-ink-700)' }}>·</span>
          <span className="kw">{agent.timecode}</span>
        </div>
      </div>

      <Tape agent={agent} animating={animating} />

      <div className="telemcell">
        <div className="row">
          <span><b>{agent.files}</b> files</span>
          <span className="ok">✓ {agent.ok}</span>
          <span className={agent.fail > 0 ? 'fail' : ''}>✗ {agent.fail}</span>
        </div>
        <div className="bar"><div style={{ width: agent.progress + '%' }} /></div>
        <div className="row" style={{ marginTop: 1 }}>
          <span className="timecode"><span className="label">eta</span>{agent.eta}</span>
          <span
            style={{
              color:
                agent.state === 'errored' ? 'oklch(0.78 0.18 25)' :
                agent.state === 'leading' ? 'var(--vf-flux-400)' : 'var(--vf-teal-300)',
              fontFamily: 'var(--font-mono)', fontSize: 10.5, textAlign: 'right',
              maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {agent.nowDoing}
          </span>
        </div>
      </div>
    </div>
  );
}
