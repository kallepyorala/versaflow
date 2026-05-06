import { SettingsCard } from './shared';

export function AccountPane() {
  return (
    <SettingsCard title="Account">
      <div className="account-strip">
        <div className="account-avatar">EH</div>
        <div className="account-meta">
          <div><b>Erik Hallé</b></div>
          <div className="muted">erik@acme.co</div>
          <div className="muted" style={{ fontSize: 11 }}>Pro plan · seat 4 of 12</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="settings-btn">Manage billing</button>
          <button className="settings-btn ghost danger">Sign out</button>
        </div>
      </div>
    </SettingsCard>
  );
}
