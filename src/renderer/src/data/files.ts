import type { FileEntry } from '@/types';

export const FILES: FileEntry[] = [
  { ic: 'M', path: ['src/billing/', 'reducer.ts'], pos: '+84', neg: '−37', selected: true },
  { ic: 'M', path: ['src/billing/', 'useBilling.ts'], pos: '+22', neg: '−14' },
  { ic: 'A', path: ['src/billing/', 'actions.ts'], pos: '+41', neg: null },
  { ic: 'A', path: ['src/billing/', 'selectors.ts'], pos: '+28', neg: null },
  { ic: 'M', path: ['src/checkout/', 'CheckoutForm.tsx'], pos: '+8', neg: '−5' },
  { ic: 'M', path: ['src/checkout/', 'SeatPicker.tsx'], pos: '+6', neg: '−3' },
  { ic: 'M', path: ['src/billing/__tests__/', 'reducer.test.ts'], pos: '+34', neg: '−2' },
  { ic: 'D', path: ['src/billing/', 'legacy.ts'], pos: null, neg: '−92', dim: true },
];

export interface DiffLine {
  kind: 'hunk' | 'ctx' | 'add' | 'del';
  g: number | string;
  code: string;
}

export const FILE_HUNKS: Record<string, DiffLine[]> = {
  'src/billing/reducer.ts': [
    { kind: 'hunk', g: '', code: '@@ -42,9 +42,17 @@  billingReducer' },
    { kind: 'ctx',  g: 42, code: "import { initialBillingState } from './state';" },
    { kind: 'ctx',  g: 43, code: '' },
    { kind: 'ctx',  g: 44, code: 'export function billingReducer(state, action) {' },
    { kind: 'del',  g: 45, code: "  if (action.type === 'PATCH') {" },
    { kind: 'del',  g: 46, code: '    return { ...state, ...action.payload };' },
    { kind: 'del',  g: 47, code: '  }' },
    { kind: 'del',  g: 48, code: '  return state;' },
    { kind: 'add',  g: 45, code: '  switch (action.type) {' },
    { kind: 'add',  g: 46, code: "    case 'SET_PLAN':     return { ...state, plan: action.plan };" },
    { kind: 'add',  g: 47, code: "    case 'UPDATE_SEATS': return { ...state, seats: action.seats };" },
    { kind: 'add',  g: 48, code: "    case 'RESET':        return initialBillingState;" },
    { kind: 'add',  g: 49, code: '    default:             return state;' },
    { kind: 'add',  g: 50, code: '  }' },
    { kind: 'ctx',  g: 51, code: '}' },
    { kind: 'hunk', g: '', code: '@@ -71,4 +79,12 @@  billingSelectors' },
    { kind: 'ctx',  g: 79, code: 'export const billingSelectors = {' },
    { kind: 'ctx',  g: 80, code: '  plan:  (s) => s.plan,' },
    { kind: 'ctx',  g: 81, code: '  seats: (s) => s.seats,' },
    { kind: 'add',  g: 82, code: '  total: (s) => s.plan.price * s.seats,' },
    { kind: 'add',  g: 83, code: '};' },
  ],
  'src/billing/useBilling.ts': [
    { kind: 'hunk', g: '', code: '@@ -14,8 +14,12 @@  useBilling' },
    { kind: 'ctx',  g: 14, code: 'export function useBilling() {' },
    { kind: 'ctx',  g: 15, code: '  const [state, dispatch] = useReducer(billingReducer, initialBillingState);' },
    { kind: 'del',  g: 16, code: "  const setPlan = (p) => dispatch({ type: 'PATCH', payload: { plan: p } });" },
    { kind: 'del',  g: 17, code: "  const setSeats = (n) => dispatch({ type: 'PATCH', payload: { seats: n } });" },
    { kind: 'add',  g: 16, code: "  const setPlan = (plan) => dispatch({ kind: 'SET_PLAN', plan });" },
    { kind: 'add',  g: 17, code: "  const setSeats = (seats) => dispatch({ kind: 'UPDATE_SEATS', seats });" },
    { kind: 'add',  g: 18, code: "  const reset = () => dispatch({ kind: 'RESET' });" },
    { kind: 'ctx',  g: 19, code: '  return { state, setPlan, setSeats, reset };' },
    { kind: 'ctx',  g: 20, code: '}' },
  ],
  'src/billing/actions.ts': [
    { kind: 'hunk', g: '', code: '@@ -0,0 +1,12 @@  (new file)' },
    { kind: 'add',  g: 1,  code: '// Discriminated billing actions — replaces legacy PATCH' },
    { kind: 'add',  g: 2,  code: 'export type BillingAction =' },
    { kind: 'add',  g: 3,  code: "  | { kind: 'SET_PLAN'; plan: Plan }" },
    { kind: 'add',  g: 4,  code: "  | { kind: 'UPDATE_SEATS'; seats: number }" },
    { kind: 'add',  g: 5,  code: "  | { kind: 'RESET' };" },
    { kind: 'add',  g: 6,  code: '' },
    { kind: 'add',  g: 7,  code: "export const setPlan = (plan: Plan): BillingAction => ({ kind: 'SET_PLAN', plan });" },
    { kind: 'add',  g: 8,  code: "export const updateSeats = (seats: number): BillingAction => ({ kind: 'UPDATE_SEATS', seats });" },
    { kind: 'add',  g: 9,  code: "export const reset = (): BillingAction => ({ kind: 'RESET' });" },
  ],
  'src/billing/selectors.ts': [
    { kind: 'hunk', g: '', code: '@@ -0,0 +1,9 @@  (new file)' },
    { kind: 'add',  g: 1, code: "import type { BillingState } from './state';" },
    { kind: 'add',  g: 2, code: '' },
    { kind: 'add',  g: 3, code: 'export const selectPlan  = (s: BillingState) => s.plan;' },
    { kind: 'add',  g: 4, code: 'export const selectSeats = (s: BillingState) => s.seats;' },
    { kind: 'add',  g: 5, code: 'export const selectTotal = (s: BillingState) => s.plan.price * s.seats;' },
  ],
  'src/checkout/CheckoutForm.tsx': [
    { kind: 'hunk', g: '', code: '@@ -82,5 +82,8 @@  CheckoutForm' },
    { kind: 'ctx',  g: 82, code: '  function onPlanChange(id: string) {' },
    { kind: 'del',  g: 83, code: "    dispatch({ type: 'PATCH', payload: { planId: id } });" },
    { kind: 'add',  g: 83, code: "    dispatch({ kind: 'SET_PLAN', planId: id });" },
    { kind: 'ctx',  g: 84, code: '  }' },
  ],
  'src/checkout/SeatPicker.tsx': [
    { kind: 'hunk', g: '', code: '@@ -41,4 +41,5 @@  SeatPicker' },
    { kind: 'ctx',  g: 41, code: '  function onChange(seats: number) {' },
    { kind: 'del',  g: 42, code: "    dispatch({ type: 'PATCH', payload: { seats } });" },
    { kind: 'add',  g: 42, code: "    dispatch({ kind: 'UPDATE_SEATS', seats });" },
    { kind: 'ctx',  g: 43, code: '  }' },
  ],
  'src/billing/__tests__/reducer.test.ts': [
    { kind: 'hunk', g: '', code: '@@ -8,6 +8,16 @@  billingReducer · suite' },
    { kind: 'ctx',  g: 8,  code: "describe('billingReducer', () => {" },
    { kind: 'add',  g: 9,  code: "  it('handles SET_PLAN', () => {" },
    { kind: 'add',  g: 10, code: '    expect(billingReducer(initial, setPlan(pro))).toEqual({ ...initial, plan: pro });' },
    { kind: 'add',  g: 11, code: '  });' },
    { kind: 'add',  g: 12, code: "  it('handles UPDATE_SEATS', () => {" },
    { kind: 'add',  g: 13, code: '    expect(billingReducer(initial, updateSeats(3)).seats).toBe(3);' },
    { kind: 'add',  g: 14, code: '  });' },
    { kind: 'add',  g: 15, code: "  it('handles RESET', () => {" },
    { kind: 'add',  g: 16, code: '    expect(billingReducer(some, reset())).toEqual(initial);' },
    { kind: 'add',  g: 17, code: '  });' },
  ],
  'src/billing/legacy.ts': [
    { kind: 'hunk', g: '', code: '@@ -1,92 +0,0 @@  (deleted)' },
    { kind: 'del',  g: 1, code: '// Removed — replaced by actions.ts + selectors.ts.' },
    { kind: 'del',  g: 2, code: '// 92 lines of legacy PATCH plumbing deleted in this commit.' },
  ],
};
