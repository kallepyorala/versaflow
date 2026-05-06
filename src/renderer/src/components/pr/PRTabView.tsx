import { PR_DATA } from '@/data/pr';
import { PRChecksSidebar } from './PRChecksSidebar';

export function PRTabView() {
  const pr = PR_DATA;
  return (
    <div className="pr-shell">
      <div className="pr-main">
        <div className="pr-header">
          <div className="pr-eyebrow">
            <span className="pr-num">#{pr.number}</span>
            <span>·</span>
            <span>nume-billing</span>
            <span>·</span>
            <span className="pr-state-pill open"><span className="d" />open</span>
          </div>
          <h1 className="pr-title">{pr.title}</h1>
          <div className="pr-meta-row">
            <span className="who"><span className="av">C</span>claude</span>
            <span>wants to merge</span>
            <span className="branch">{pr.branch}</span>
            <span className="arrow">→</span>
            <span className="branch base">{pr.base}</span>
            <span>·</span>
            <span className="delta">
              <span className="pos">+{pr.diff.add}</span>{' '}
              <span className="neg">−{pr.diff.del}</span>{' '}
              <span style={{ color: 'var(--vf-ink-500)' }}>across {pr.diff.files} files</span>
            </span>
          </div>
        </div>

        <div className="pr-section">
          <div className="pr-section-h">
            <span>Description</span>
            <span className="spacer" />
            <button className="lk">edit</button>
          </div>
          <div className="pr-desc">
            {pr.desc.map((b, i) => {
              if (b.type === 'h') return <h3 key={i}>{b.text}</h3>;
              if (b.type === 'p') return <p key={i}>{b.text}</p>;
              if (b.type === 'ul') return <ul key={i}>{b.items!.map((it, j) => <li key={j}>{it}</li>)}</ul>;
              return null;
            })}
          </div>
        </div>

        <div className="pr-section">
          <div className="pr-section-h">
            <span>Conversation</span>
            <span className="count">{pr.conv.filter((c) => c.role !== 'event').length}</span>
            <span className="spacer" />
            <button className="lk">jump to unread</button>
          </div>
          <div className="pr-conv-list">
            {pr.conv.map((c, i) => (
              <div
                key={i}
                className={`pr-conv ${
                  c.role === 'event' ? 'is-event' :
                  c.role === 'bot' ? 'is-bot' : 'is-user'
                }`}
              >
                <div className="av">
                  {c.role === 'event' ? '·' : c.who[0].toUpperCase()}
                </div>
                <div className="pr-conv-body">
                  {c.role !== 'event' && (
                    <div className="pr-conv-h">
                      <span className="who">{c.who}</span>
                      <span className="when">{c.when}</span>
                    </div>
                  )}
                  <div className="pr-conv-text">
                    {c.role === 'event'
                      ? <>{c.text} · <span style={{ color: 'var(--vf-ink-600)' }}>{c.when}</span></>
                      : c.text}
                  </div>
                </div>
              </div>
            ))}

            <div className="pr-composer">
              <div className="av">K</div>
              <div className="pr-composer-box">
                <textarea placeholder="Reply, or @mention an agent…" />
                <div className="pr-composer-foot">
                  <button className="btn ghost" style={{ height: 24, fontSize: 11 }}>@claude</button>
                  <button className="btn ghost" style={{ height: 24, fontSize: 11 }}>@gpt-5</button>
                  <span style={{ flex: 1 }} />
                  <button className="btn" style={{ height: 24, fontSize: 11 }}>Comment</button>
                  <button className="btn flux" style={{ height: 24, fontSize: 11, fontWeight: 600 }}>
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pr-section last">
          <div className="pr-section-h">
            <span>Commits</span>
            <span className="count">{pr.commits.length}</span>
            <span className="spacer" />
            <button className="lk">view diff</button>
          </div>
          <div className="pr-commits">
            {pr.commits.map((c) => (
              <div key={c.sha} className="pr-commit">
                <span className="sha">{c.sha}</span>
                <span className="msg">{c.msg}</span>
                <span className="when">{c.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PRChecksSidebar />
    </div>
  );
}
