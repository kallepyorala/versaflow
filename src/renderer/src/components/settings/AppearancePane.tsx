import { SettingsCard, FieldLabel } from './shared';

export type Theme = 'light' | 'dark' | 'system';

export function AppearancePane({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const themes: Theme[] = ['light', 'dark', 'system'];
  return (
    <SettingsCard title="Appearance" sub="Choose how Versaflow looks.">
      <FieldLabel label="Theme">
        <div className="settings-seg">
          {themes.map((t) => (
            <button key={t} className={`settings-seg-btn ${theme === t ? 'active' : ''}`} onClick={() => setTheme(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </FieldLabel>
      <FieldLabel label="Density" hint="(comfortable for normal monitors)">
        <div className="settings-seg">
          {(['compact', 'comfortable', 'loose'] as const).map((d) => (
            <button key={d} className={`settings-seg-btn ${d === 'comfortable' ? 'active' : ''}`}>
              {d[0].toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </FieldLabel>
      <FieldLabel label="Accent" hint="(used for live agents and call-outs)">
        <div className="settings-swatches">
          {[
            { k: 'flux',   c: 'var(--vf-flux-500)',     on: true  },
            { k: 'teal',   c: 'var(--vf-teal-400)' },
            { k: 'violet', c: 'oklch(0.65 0.2 290)' },
            { k: 'rose',   c: 'oklch(0.7 0.18 15)' },
            { k: 'lime',   c: 'oklch(0.78 0.18 130)' },
          ].map((s) => (
            <button
              key={s.k}
              className={`settings-swatch ${s.on ? 'on' : ''}`}
              style={{ ['--sw' as string]: s.c } as React.CSSProperties}
              aria-label={s.k}
            />
          ))}
        </div>
      </FieldLabel>
    </SettingsCard>
  );
}
