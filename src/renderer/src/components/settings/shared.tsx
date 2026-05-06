import { type ReactNode, useState } from 'react';

export function SettingsCard({
  title, sub, children, footer,
}: { title: string; sub?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="settings-card">
      <div className="settings-card-h">
        <h3>{title}</h3>
        {sub && <p>{sub}</p>}
      </div>
      <div className="settings-card-body">{children}</div>
      {footer && <div className="settings-card-foot">{footer}</div>}
    </div>
  );
}

export function FieldLabel({
  label, hint, children,
}: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="settings-field">
      <label>
        {label}
        {hint && <span className="hint"> {hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function SettingsToggle({ on }: { on: boolean }) {
  const [v, setV] = useState(on);
  return (
    <button
      className={`lin-switch big ${v ? 'on' : ''}`}
      onClick={() => setV((x) => !x)}
      aria-pressed={v}
    >
      <span className="lin-switch-knob" />
    </button>
  );
}
