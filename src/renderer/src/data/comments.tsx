import type { OvComment, IssueCommentItem } from '@/types';

export const OV_COMMENTS: OvComment[] = [
  { id: 1, file: 'src/billing/reducer.ts', lr: 'L49', line: 49, status: 'open', body: 'Why default to `state` here? A no-op return masks misrouted actions.', anchor: 'L49', stale: false },
  { id: 2, file: 'src/billing/useBilling.ts', lr: 'L17', line: 17, status: 'open', body: 'Should the seat update be debounced before it dispatches? The checkout page fires this onChange.', anchor: 'L17', stale: false },
  { id: 3, file: 'src/billing/legacy.ts', lr: 'L1', line: 1, status: 'stale', body: 'Verify column rename is backwards-compatible with the iOS client v3.4.', anchor: 'L1', stale: true },
  { id: 4, file: 'src/billing/actions.ts', lr: 'L7', line: 7, status: 'open', body: 'zod is fine but we already use yup elsewhere — should we standardise before adding a third validator?', anchor: 'L7' },
  { id: 5, file: 'src/billing/__tests__/reducer.test.ts', lr: 'L13', line: 13, status: 'addressed', body: 'Snapshot test was updated by codex on retry — looks good now.', anchor: 'L13' },
];

export const ISSUE_COMMENTS: IssueCommentItem[] = [
  {
    id: 1, who: 'Maya Chen', role: 'PM', initials: 'MC', color: 'oklch(0.72 0.16 290)',
    when: '3d ago',
    body: <>Customers on the Pro plan have been reporting their seat counts ghost-resetting after a refresh. We traced two of the three reports to <code>PATCH</code> being dispatched with a partial payload that overwrote <code>seats</code> with <code>undefined</code>. Adding context for whoever picks this up.</>,
    reactions: [{ e: '👀', n: 4 }, { e: '🙏', n: 2 }],
  },
  {
    id: 2, who: 'Devon Park', role: 'Eng', initials: 'DP', color: 'oklch(0.74 0.13 175)',
    when: '2d ago',
    body: <>I'd push for a discriminated union over a string <code>type</code>. We get exhaustiveness checks for free and the action surface stops drifting. Happy to pair on the migration path for the persisted snapshots — that's the part that bites.</>,
    reactions: [{ e: '💯', n: 3 }],
  },
  {
    id: 3, who: 'Maya Chen', role: 'PM', initials: 'MC', color: 'oklch(0.72 0.16 290)',
    when: '2d ago',
    body: <>Snapshot migration is out of scope for this ticket — let's spike that separately. Same for the Stripe webhook handlers; they share state shape but the contract there is a separate review.</>,
  },
  {
    id: 4, who: 'Riya Kapoor', role: 'Design', initials: 'RK', color: 'oklch(0.78 0.14 60)',
    when: '1d ago',
    body: <>Heads up: the Seats picker calls <code>setSeats</code> on every keystroke today. If we don't debounce when we move to <code>UPDATE_SEATS</code>, the action log gets noisy and the optimistic UI flickers. Not a blocker — flagging.</>,
    reactions: [{ e: '👍', n: 2 }],
  },
  {
    id: 5, who: 'agent · codex', role: 'Agent', initials: 'x', color: 'oklch(0.74 0.16 200)', agent: true,
    when: '14:02',
    body: <>Picked this up. Branched <code>vf-1284-refactor-billing-reducer</code> off <code>main@a3f7c12</code>. Plan: split into <code>SET_PLAN</code> · <code>UPDATE_SEATS</code> · <code>RESET</code>, add an exhaustive default that throws, and update the two checkout call sites in the same commit.</>,
  },
];
