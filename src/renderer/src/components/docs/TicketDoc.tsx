export function TicketDoc() {
  return (
    <div className="md-view">
      <div className="md-inner">
        <div className="md-eyebrow">VF-1284 · imported from Linear · 13:58</div>
        <h1
          className="md-h1"
          style={{ fontStyle: 'normal', fontFamily: 'var(--font-sans)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.018em' }}
        >
          Refactor billing reducer
        </h1>
        <p className="md-lede">
          The legacy <code>PATCH</code> action in <code>src/billing/reducer.ts</code> mutates state opaquely and makes seat-update bugs hard to trace. Replace it with explicit slice actions and a derived selector.
        </p>
        <h2 className="md-h2">Acceptance</h2>
        <ul className="md-ul">
          <li>Three explicit actions: <code>SET_PLAN</code>, <code>UPDATE_SEATS</code>, <code>RESET</code>.</li>
          <li>All existing tests pass (don't modify <code>__snapshots__</code>).</li>
          <li><code>vitest src/billing</code> green before opening PR.</li>
          <li>Type checks clean: <code>tsc --noEmit</code>.</li>
        </ul>
        <h2 className="md-h2">Out of scope</h2>
        <ul className="md-ul">
          <li>Migration of the persisted billing snapshot format.</li>
          <li>Changes to the Stripe webhook handlers.</li>
        </ul>
        <h2 className="md-h2">Linked</h2>
        <ul className="md-ul">
          <li><code>VF-1276</code> — flaky webhook retry test (separate work)</li>
          <li><code>VF-1268</code> — trial banner copy (done)</li>
        </ul>
      </div>
    </div>
  );
}
