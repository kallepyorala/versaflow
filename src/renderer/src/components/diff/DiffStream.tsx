import { type MutableRefObject, useMemo } from 'react';
import type { FileEntry } from '@/types';
import { FILE_HUNKS } from '@/data/files';
import { OV_COMMENTS } from '@/data/comments';
import { fullPath } from '@/utils/files';

interface DiffStreamProps {
  files: FileEntry[];
  collapsedFiles: string[];
  toggleFile: (fp: string) => void;
  fileRefs: MutableRefObject<Record<string, HTMLElement | null>>;
}

export function DiffStream({ files, collapsedFiles, toggleFile, fileRefs }: DiffStreamProps) {
  const commentsByFile = useMemo(() => {
    const map: Record<string, typeof OV_COMMENTS> = {};
    OV_COMMENTS.forEach((c) => {
      if (!map[c.file]) map[c.file] = [];
      map[c.file].push(c);
    });
    return map;
  }, []);

  return (
    <div className="diff-stream">
      {files.map((f) => {
        const fp = fullPath(f);
        const hunks = FILE_HUNKS[fp] || [];
        const isCollapsed = collapsedFiles.includes(fp);
        const adds = hunks.filter((l) => l.kind === 'add').length;
        const dels = hunks.filter((l) => l.kind === 'del').length;
        const fileComments = commentsByFile[fp] || [];
        const openCount = fileComments.filter((c) => c.status === 'open' || c.status === 'stale').length;

        const lineHasComment = (kind: string, g: number | string) => {
          if (kind !== 'add' && kind !== 'ctx') return null;
          return fileComments.find((c) => c.line === g) || null;
        };

        return (
          <section
            key={fp}
            className={`ds-file ${isCollapsed ? 'collapsed' : ''}`}
            ref={(el) => { fileRefs.current[fp] = el; }}
            id={`file-${fp.replace(/[^a-z0-9]/gi, '-')}`}
          >
            <button
              className="ds-sep"
              onClick={() => toggleFile(fp)}
              type="button"
              aria-expanded={!isCollapsed}
            >
              <svg className="ds-chev" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span className={`ds-ic ${f.ic.toLowerCase()}`}>{f.ic}</span>
              <span className="ds-path">
                <span className="dim">{f.path[0]}</span>
                <span className={f.dim ? 'muted' : ''}>{f.path[1]}</span>
              </span>
              {fileComments.length > 0 && (
                <span
                  className={`ds-cmt-badge ${openCount > 0 ? 'open' : 'addressed'}`}
                  title={`${fileComments.length} comment${fileComments.length === 1 ? '' : 's'}`}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{fileComments.length}</span>
                </span>
              )}
              <span className="ds-spacer" />
              <span className="ds-stat">
                <span className="pos">+{adds}</span>
                <span className="neg">−{dels}</span>
              </span>
            </button>
            {!isCollapsed && (
              <div className="diff" style={{ padding: '6px 0 14px' }}>
                {hunks.map((l, i) => {
                  const cmt = lineHasComment(l.kind, l.g);
                  return (
                    <div
                      key={i}
                      className={`ln ${
                        l.kind === 'add' ? 'add' :
                        l.kind === 'del' ? 'del' :
                        l.kind === 'hunk' ? 'hunk' : ''
                      } ${cmt ? `has-cmt ${cmt.status}` : ''}`}
                      title={cmt ? cmt.body : undefined}
                    >
                      <span className="gut">
                        {l.kind === 'add' ? '+' : l.kind === 'del' ? '−' : ''} {l.g}
                      </span>
                      <span className="code">{l.code}</span>
                      {cmt && (
                        <span className="ln-cmt-mark" aria-label={`${cmt.status} comment`}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
