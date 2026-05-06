import { SettingsCard, FieldLabel, SettingsToggle } from './shared';

export function LinearPane() {
  return (
    <>
      <SettingsCard
        title="Linear"
        sub="Connect Versaflow to your Linear workspace using a personal API key."
      >
        <div className="account-strip">
          <div className="account-avatar">KP</div>
          <div className="account-meta">
            <div><b>Kalle Pyörälä</b> <span className="muted">(kpy@scaleup.finance)</span></div>
            <div className="muted">Organization · <b>Scaleup Finance</b></div>
            <div className="muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              Last synced 5/2/2026, 11:13:17 AM
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="settings-btn">Sync now</button>
            <button className="settings-btn ghost">Disconnect</button>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard title="Sync preferences">
        <FieldLabel label="Issue states to import">
          <div className="settings-chips">
            {['Backlog', 'Todo', 'In Progress', 'In Review', 'In verification', 'Done', 'Cancelled'].map((s, i) => (
              <button key={s} className={`settings-chip ${i < 5 ? 'on' : ''}`}>{s}</button>
            ))}
          </div>
        </FieldLabel>
        <FieldLabel label="Auto-pull new issues" hint="(every 60 seconds)">
          <SettingsToggle on={true} />
        </FieldLabel>
      </SettingsCard>
    </>
  );
}
