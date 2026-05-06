import type { ReactNode } from 'react';

export interface PRDescBlock {
  type: 'h' | 'p' | 'ul';
  text?: string;
  items?: ReactNode[];
}

export interface PRConvEntry {
  who: string;
  role: 'bot' | 'user' | 'event';
  when: string;
  text: ReactNode;
}

export interface PRCommit { sha: string; msg: string; when: string }

export const PR_DATA = {
  num: 4131,
  title: 'Bill cycle reducer: handle proration on mid-cycle plan switch',
  state: 'open',
  author: 'claude',
  branch: 'claude/billing-prorate',
  base: 'main',
  diff: { add: 184, del: 67, files: 8 },
  desc: [
    { type: 'h', text: 'What' },
    { type: 'p', text: 'Mid-cycle plan switches were applied at full price for the new tier instead of being prorated against the unused portion of the prior tier. This rewires the billing-cycle reducer to compute a daily prorated credit on switch and emit a single adjusted invoice line.' },
    { type: 'h', text: 'Why' },
    { type: 'p', text: 'Linear NUME-2841 — surfaced by 14 customer reports between Apr 2 and Apr 14. Without proration, customers upgrading on day 28 of a 30-day cycle were charged for ~30 days at the new tier, ~28 of which they\'d already paid for at the old tier.' },
    { type: 'h', text: 'Approach' },
    {
      type: 'ul',
      items: [
        <>Added <code>prorationCredit(prevPlan, newPlan, asOf)</code> to <code>src/billing/proration.ts</code></>,
        <>Reducer now branches on <code>action === "PLAN_SWITCH"</code> and emits a <code>credit</code> line item with the unused-time amount</>,
        <>Invoice generator collapses adjacent same-cycle credits into a single line</>,
        <>Backfill migration <code>2025_04_15_prorate_open_invoices</code> recomputes ~340 currently-open invoices</>,
      ],
    },
    { type: 'h', text: 'Risk' },
    { type: 'p', text: 'Reducer change is behind feature flag billing.proration.v2; rollout via 5% → 25% → 100%. Backfill is idempotent and dry-run-able.' },
  ] as PRDescBlock[],
  conv: [
    { who: 'claude', role: 'bot',  when: '32m ago', text: 'Opened PR. CI is running; I added two new fixtures in proration.fixtures.ts covering the day-28-of-30 and the same-day-switch cases that NUME-2841 reported.' },
    { who: 'kalle',  role: 'user', when: '21m ago', text: 'Looks right. Did you check what happens when the user switches BACK to the cheaper tier mid-cycle? Should be a refund line, not a charge.' },
    { who: 'claude', role: 'bot',  when: '18m ago', text: 'Good catch — the v1 logic just no-op\'d that case. Added a downgrade branch that emits a refund line with negative amount. Fixture proration.downgrade.test.ts covers it.' },
    { who: 'event',  role: 'event', when: '12m ago', text: <><b>gpt-5</b> requested changes — see comment on <code>src/billing/reducer.ts:142</code></> },
    { who: 'event',  role: 'event', when: '6m ago',  text: <><b>verifier</b> reported a regression in <code>billing.invoice.snapshot</code> — 3 of 18 snapshots changed</> },
  ] as PRConvEntry[],
  commits: [
    { sha: 'a4f7c12', msg: 'billing: add prorationCredit and switch-action branch', when: '1h ago' },
    { sha: '8e2b09d', msg: 'billing: emit credit line on PLAN_SWITCH', when: '55m ago' },
    { sha: 'd1c4f88', msg: 'billing: collapse same-cycle credits in invoice generator', when: '42m ago' },
    { sha: '3b9a2e1', msg: 'billing: backfill open invoices behind feature flag', when: '38m ago' },
    { sha: 'f06d147', msg: 'billing: handle downgrade case (refund line)', when: '18m ago' },
    { sha: 'e2b9510', msg: 'billing: snapshot updates after collapse rule change', when: '11m ago' },
  ] as PRCommit[],
};

export type PRCheckState = 'pass' | 'fail' | 'run' | 'skip' | 'queued';

export interface PRCheck {
  name: string;
  src: string;
  state: PRCheckState;
  dur?: string;
  err?: string;
  queued?: number;
}

export const PR_CHECKS: { required: PRCheck[]; optional: PRCheck[] } = {
  required: [
    { name: 'lint', src: 'GitHub Actions', state: 'pass', dur: '42s' },
    { name: 'typecheck', src: 'GitHub Actions', state: 'pass', dur: '1m 18s' },
    {
      name: 'unit / billing', src: 'GitHub Actions', state: 'fail', dur: '2m 04s',
      err: 'FAIL  src/billing/reducer.spec.ts > PLAN_SWITCH > emits credit on mid-cycle downgrade\n  Expected: { type: "credit", amount: -1842 }\n  Received: { type: "credit", amount: -1840 }\n  // off-by-2¢ — float rounding in dailyRate()',
    },
    { name: 'unit / core', src: 'GitHub Actions', state: 'pass', dur: '3m 11s' },
    { name: 'integration', src: 'GitHub Actions', state: 'run', queued: 0 },
    { name: 'e2e / playwright', src: 'GitHub Actions', state: 'queued' },
  ],
  optional: [
    {
      name: 'verifier (claude)', src: 'Versaflow', state: 'fail', dur: '47s',
      err: 'Snapshot regression: billing.invoice.snapshot — 3 of 18 cases changed.\n  · dec-mid-cycle-upgrade.json\n  · jan-prorated-credit.json\n  · feb-downgrade-refund.json',
    },
    { name: 'judge (gpt-5)', src: 'Versaflow', state: 'pass', dur: '1m 02s' },
    { name: 'bundle size', src: 'size-limit', state: 'pass', dur: '9s' },
    { name: 'preview deploy', src: 'Vercel', state: 'run' },
    { name: 'license check', src: 'fossa', state: 'skip' },
  ],
};
