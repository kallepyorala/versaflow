import { SettingsCard, FieldLabel, SettingsToggle } from './shared';

export function AgentsPane() {
  return (
    <SettingsCard title="AI agents" sub="Configure which agents race on each issue and how they're allowed to act.">
      <FieldLabel label="Default lineup">
        <div className="settings-chips">
          {['claude', 'codex', 'gpt-5', 'gemini', 'grok'].map((a, i) => (
            <button key={a} className={`settings-chip ${i < 3 ? 'on' : ''}`}>{a}</button>
          ))}
        </div>
      </FieldLabel>
      <FieldLabel label="Effort budget" hint="(per agent, per issue)">
        <div className="settings-seg">
          {(['low', 'medium', 'high', 'unlimited'] as const).map((e) => (
            <button key={e} className={`settings-seg-btn ${e === 'medium' ? 'active' : ''}`}>
              {e[0].toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </FieldLabel>
      <FieldLabel label="Allow agents to install packages"><SettingsToggle on={false} /></FieldLabel>
      <FieldLabel label="Allow agents to push branches"><SettingsToggle on={true} /></FieldLabel>
      <FieldLabel label="Auto-promote winning candidate"><SettingsToggle on={false} /></FieldLabel>
    </SettingsCard>
  );
}
