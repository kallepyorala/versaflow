import type { IssueCommentItem } from '@/types';
import { IssueAvatar } from './IssueAvatar';

export function IssueComment({ c, isLast }: { c: IssueCommentItem; isLast: boolean }) {
  return (
    <div className={`iv-cmt ${c.agent ? 'is-agent' : ''} ${c.externalId === null ? 'is-pending' : ''}`}>
      <div className="iv-cmt-rail">
        <IssueAvatar c={c} />
        {!isLast && <span className="iv-cmt-thread" />}
      </div>
      <div className="iv-cmt-body">
        <div className="iv-cmt-head">
          <span className="iv-cmt-who">{c.who}</span>
          <span className="iv-cmt-role">{c.role}</span>
          <span className="iv-cmt-when">{c.when}</span>
        </div>
        <div className="iv-cmt-text">{c.body}</div>
        {c.reactions && (
          <div className="iv-cmt-rx">
            {c.reactions.map((r, i) => (
              <span key={i} className="iv-rx">
                <span className="e">{r.e}</span>
                <span className="n">{r.n}</span>
              </span>
            ))}
            <button type="button" className="iv-rx-add" title="Add reaction">+</button>
          </div>
        )}
      </div>
    </div>
  );
}
