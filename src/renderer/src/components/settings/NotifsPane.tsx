import { SettingsCard, FieldLabel, SettingsToggle } from './shared';

export function NotifsPane() {
  return (
    <SettingsCard title="Notifications" sub="Decide what bumps your dock and what stays in the activity feed.">
      <FieldLabel label="Race finished"><SettingsToggle on={true} /></FieldLabel>
      <FieldLabel label="Agent errored or stalled"><SettingsToggle on={true} /></FieldLabel>
      <FieldLabel label="Permission requested"><SettingsToggle on={true} /></FieldLabel>
      <FieldLabel label="Comment on PR"><SettingsToggle on={false} /></FieldLabel>
      <FieldLabel label="Daily digest" hint="(7am local)"><SettingsToggle on={false} /></FieldLabel>
    </SettingsCard>
  );
}
