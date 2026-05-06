import { SettingsCard } from './shared';

const SHORTCUTS = [
  { label: 'Open command palette', keys: ['⌘', 'K'] },
  { label: 'Switch issue',         keys: ['⌘', 'O'] },
  { label: 'Promote winner',       keys: ['⌘', '↩'] },
  { label: 'Pause race',           keys: ['␣'] },
  { label: 'Replay race',          keys: ['⌘', 'R'] },
  { label: 'Toggle terminal split', keys: ['⌘', '\\'] },
  { label: 'Open in editor',       keys: ['⌘', 'E'] },
  { label: 'Settings',             keys: ['⌘', ','] },
];

export function ShortcutsPane() {
  return (
    <SettingsCard title="Shortcuts" sub="A quick reference. Click any binding to rebind it.">
      <div className="shortcut-list">
        {SHORTCUTS.map((s) => (
          <div key={s.label} className="shortcut-row">
            <span>{s.label}</span>
            <span className="shortcut-keys">
              {s.keys.map((k, i) => <kbd key={i}>{k}</kbd>)}
            </span>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}
