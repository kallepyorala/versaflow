import { useEffect, useRef, useState } from 'react';

interface AddWorktreeDialogProps {
  open: boolean;
  baseBranch: string;
  currentBranch: string;
  existing: string[];
  onCancel: () => void;
  onConfirm: (name: string) => void;
}

export function AddWorktreeDialog({ open, baseBranch, currentBranch, existing, onCancel, onConfirm }: AddWorktreeDialogProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const baseStem = (currentBranch || 'feature').replace(/-v\d+$/, '');
    let n = 2;
    let candidate = `${baseStem}-v${n}`;
    while (existing.includes(candidate)) {
      n++;
      candidate = `${baseStem}-v${n}`;
    }
    setName(candidate);
    setTimeout(() => {
      inputRef.current?.focus();
      const el = inputRef.current;
      if (el) {
        const v = el.value;
        const idx = v.lastIndexOf('-');
        if (idx > 0) el.setSelectionRange(idx + 1, v.length);
        else el.select();
      }
    }, 30);
  }, [open, currentBranch, existing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && name && !existing.includes(name)) {
        e.preventDefault();
        onConfirm(name);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, name, existing, onCancel, onConfirm]);

  if (!open) return null;
  const conflict = existing.includes(name);
  const empty = !name.trim();
  const disabled = conflict || empty;
  const stem = (currentBranch || 'feature').replace(/-v\d+$/, '');
  const suffixes = [
    { label: '-v2', val: `${stem}-v2` },
    { label: '-spike', val: `${stem}-spike` },
    { label: '-experiment', val: `${stem}-experiment` },
    { label: '-claude', val: `${stem}-claude` },
    { label: '-codex', val: `${stem}-codex` },
  ].filter((s) => !existing.includes(s.val));

  return (
    <div
      className="wt-dialog-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="wt-dialog" role="dialog" aria-label="Add worktree">
        <div className="wt-dialog-h">
          <h3>Add worktree</h3>
          <p>
            Spin up another isolated copy of this issue. Branches off{' '}
            <span style={{ color: 'var(--vf-teal-300)', fontFamily: 'var(--font-mono)' }}>{baseBranch}</span>
            {' '}· runs the repo's setup command.
          </p>
        </div>
        <div className="wt-dialog-body">
          <div className="wt-dialog-field">
            <label>Branch name</label>
            <input
              ref={inputRef}
              value={name}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
            />
            {conflict && (
              <span className="wt-dialog-hint" style={{ color: 'oklch(0.78 0.18 25)' }}>
                A worktree with that name already exists.
              </span>
            )}
            {!conflict && !empty && (
              <span className="wt-dialog-hint">
                Path · <span className="mono">~/Projects/acme/worktrees/{name}</span>
              </span>
            )}
          </div>
          {suffixes.length > 0 && (
            <div className="wt-dialog-field">
              <label>Quick suffix</label>
              <div className="wt-dialog-suffix-row">
                {suffixes.map((s) => (
                  <button
                    key={s.label}
                    className="wt-dialog-suffix-chip"
                    onClick={() => setName(s.val)}
                    type="button"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="wt-dialog-foot">
          <button className="wt-dialog-btn" onClick={onCancel} type="button">Cancel</button>
          <button
            className="wt-dialog-btn primary"
            disabled={disabled}
            onClick={() => { if (!disabled) onConfirm(name); }}
            type="button"
          >
            Add worktree
          </button>
        </div>
      </div>
    </div>
  );
}
