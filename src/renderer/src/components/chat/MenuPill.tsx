import { useEffect, useRef, useState } from 'react';
import { ICON_CARET, ICON_CHECK } from '@/icons';

export interface MenuOption {
  id: string;
  name: string;
  desc?: string;
  dot?: string;
  danger?: boolean;
  bars?: number;
  max?: boolean;
}

interface MenuPillProps {
  keyLabel: string;
  value: string;
  tone?: 'flux' | 'teal';
  options: MenuOption[];
  kind: 'mode' | 'effort';
  onChange?: (v: string) => void;
}

export function MenuPill({ keyLabel, value, tone, options, kind, onChange }: MenuPillProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((o) => o.id === value) || options[0];

  return (
    <span className="pop-wrap" ref={wrapRef}>
      <button
        className="menu-pill"
        data-tone={tone}
        data-open={open ? 'true' : 'false'}
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <span className="lbl-key">{keyLabel}</span>
        <span className="lbl-val">{current.name.toLowerCase()}</span>
        {ICON_CARET}
      </button>
      {open && (
        <div className="pop" role="menu">
          <div className="pop-h">{keyLabel}</div>
          {options.map((o, i) => {
            const selected = o.id === value;
            if (kind === 'effort') {
              return (
                <button
                  key={o.id}
                  className="pop-item effort-row"
                  aria-selected={selected}
                  onClick={() => { onChange?.(o.id); setOpen(false); }}
                  type="button"
                >
                  {ICON_CHECK}
                  <span className="pi-name">
                    <span className="nm">{o.name}</span>
                    <span className="desc">{o.desc}</span>
                  </span>
                  <span className={`meter ${o.max ? 'max' : ''}`} aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={n <= (o.bars ?? 0) ? 'on' : ''} style={{ height: 6 + n * 1.5 }} />
                    ))}
                  </span>
                  <span className="kbd">{i + 1}</span>
                </button>
              );
            }
            return (
              <button
                key={o.id}
                className={`pop-item ${o.danger ? 'danger' : ''}`}
                aria-selected={selected}
                onClick={() => { onChange?.(o.id); setOpen(false); }}
                type="button"
              >
                {ICON_CHECK}
                <span className="pi-name">
                  <span className="nm">
                    {o.dot && <span className={`dot ${o.dot}`} />}
                    {o.name}
                  </span>
                  <span className="desc">{o.desc}</span>
                </span>
                <span className="kbd">{i + 1}</span>
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}
