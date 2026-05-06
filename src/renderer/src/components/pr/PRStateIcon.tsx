import type { PRCheckState } from '@/data/pr';
import {
  PR_ICON_CHECK, PR_ICON_X, PR_ICON_RUN, PR_ICON_DASH, PR_ICON_DOT,
} from '@/icons';

export function PRStateIcon({ state }: { state: PRCheckState }) {
  if (state === 'pass') return <div className="pr-check-ic pass">{PR_ICON_CHECK}</div>;
  if (state === 'fail') return <div className="pr-check-ic fail">{PR_ICON_X}</div>;
  if (state === 'run')  return <div className="pr-check-ic run">{PR_ICON_RUN}</div>;
  if (state === 'skip') return <div className="pr-check-ic skip">{PR_ICON_DASH}</div>;
  return <div className="pr-check-ic queued">{PR_ICON_DOT}</div>;
}
