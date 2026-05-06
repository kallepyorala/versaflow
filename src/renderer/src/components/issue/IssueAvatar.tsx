import type { IssueCommentItem } from '@/types';

export function IssueAvatar({ c }: { c: IssueCommentItem }) {
  return (
    <div className="iv-av" style={{ background: c.color }} aria-hidden="true">
      <span>{c.initials}</span>
    </div>
  );
}
