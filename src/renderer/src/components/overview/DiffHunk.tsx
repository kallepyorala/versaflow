import { useState } from 'react';

export interface InlineDiffLine {
  k: 'add' | 'del' | 'ctx';
  n: number | null;
  n0?: number | null;
  t: string;
}

interface DiffHunkProps {
  file: string;
  range: string;
  pos?: number | null;
  neg?: number | null;
  defaultOpen?: boolean;
  lines: InlineDiffLine[];
  commentedLines?: number[];
}

export function DiffHunk({ file, range, pos, neg, defaultOpen, lines, commentedLines = [] }: DiffHunkProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const fileParts = file.split('/');
  const fileName = fileParts.pop()!;
  const dir = fileParts.length ? fileParts.join('/') + '/' : '';
  return (
    <div className="ov-hunk" data-open={open}>
      <div className="ov-hunk-head" onClick={() => setOpen((o) => !o)}>
        <svg className="ov-hunk-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 6 15 12 9 18" />
        </svg>
        <span className="ov-hunk-file"><span className="dim">{dir}</span>{fileName}</span>
        <span className="ov-hunk-range">{range}</span>
        <span className="ov-hunk-delta">
          {pos != null && <span className="pos">+{pos}</span>}
          {neg != null && <span className="neg">−{neg}</span>}
        </span>
      </div>
      <div className="ov-hunk-body">
        {lines.map((l, i) => (
          <div
            key={i}
            className={`ov-line ${l.k} ${l.n != null && commentedLines.includes(l.n) ? 'has-comment' : ''}`}
          >
            <span className="gutter" title="Add comment">+</span>
            <span className="ln">{l.k === 'add' ? '' : l.n0 ?? ''}</span>
            <span className="ln">{l.k === 'del' ? '' : l.n}</span>
            <span className="code">{l.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
