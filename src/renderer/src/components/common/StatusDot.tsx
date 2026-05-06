import type { IssueStatus } from '@/types';
import { STATUS_META } from '@/data/issues';

export function StatusDot({ kind, size = 10 }: { kind: IssueStatus; size?: number }) {
  const m = STATUS_META[kind] || STATUS_META.backlog;
  const s = size;
  if (m.filled) {
    return (
      <svg className="lin-stat" viewBox="0 0 14 14" width={s} height={s} aria-hidden="true">
        <circle cx="7" cy="7" r="6" fill={m.color} stroke={m.color} strokeWidth="1.5" />
        {m.x ? (
          <path d="M5 5l4 4M9 5l-4 4" stroke="var(--vf-ink-950)" strokeWidth="1.5" strokeLinecap="round" />
        ) : (
          <path
            d="M4.5 7.2l1.8 1.8 3.4-4"
            stroke="var(--vf-ink-950)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
    );
  }
  if (m.ring > 0) {
    const r = 5.2;
    const c = 2 * Math.PI * r;
    const dash = c * m.ring;
    return (
      <svg className="lin-stat" viewBox="0 0 14 14" width={s} height={s} aria-hidden="true">
        <circle cx="7" cy="7" r={r} fill="none" stroke={m.color} strokeOpacity="0.35" strokeWidth="1.6" />
        <circle
          cx="7" cy="7" r={r}
          fill="none" stroke={m.color} strokeWidth="1.6"
          strokeDasharray={`${dash} ${c}`} transform="rotate(-90 7 7)" strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg className="lin-stat" viewBox="0 0 14 14" width={s} height={s} aria-hidden="true">
      <circle cx="7" cy="7" r="5.2" fill="none" stroke={m.color} strokeWidth="1.6" strokeDasharray="2 2" />
    </svg>
  );
}
