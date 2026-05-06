import { useEffect, useMemo, useRef, useState } from 'react';
import { FILES } from '@/data/files';
import { useZen } from '@/context/zen';
import { fileExt, fullPath } from '@/utils/files';
import { FilesPanel } from './FilesPanel';
import { DiffStream } from './DiffStream';
import { CommentsRail } from '@/components/overview/CommentsRail';

export function DiffTabView() {
  const zen = useZen();
  const [filesCollapsed, setFilesCollapsed] = useState(true);
  const [commentsCollapsed, setCommentsCollapsed] = useState(true);
  useEffect(() => { if (zen) { setFilesCollapsed(true); setCommentsCollapsed(true); } }, [zen]);

  const [query, setQuery] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [collapsedFiles, setCollapsedFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState(fullPath(FILES[0]));
  const fileRefs = useRef<Record<string, HTMLElement | null>>({});

  const allTypes = useMemo(() => {
    const s = new Set<string>();
    FILES.forEach((f) => {
      const e = fileExt(f.path[1]);
      if (e) s.add(e);
    });
    return [...s].sort();
  }, []);

  const filteredFiles = useMemo(() => {
    return FILES.filter((f) => {
      const fp = fullPath(f);
      if (query && !fp.toLowerCase().includes(query.toLowerCase())) return false;
      if (types.length > 0 && !types.includes(fileExt(f.path[1]))) return false;
      return true;
    });
  }, [query, types]);

  const totalAdd = FILES.reduce((s, f) => s + (f.pos ? parseInt(f.pos.replace('+', '')) : 0), 0);
  const totalDel = FILES.reduce((s, f) => s + (f.neg ? parseInt(f.neg.replace('−', '')) : 0), 0);

  const toggleFile = (fp: string) => {
    setCollapsedFiles((cur) => (cur.includes(fp) ? cur.filter((x) => x !== fp) : [...cur, fp]));
  };
  const scrollToFile = (fp: string) => {
    setActiveFile(fp);
    const el = fileRefs.current[fp];
    if (el && el.parentElement) {
      el.parentElement.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' });
    }
  };
  const allCollapsed = collapsedFiles.length === filteredFiles.length && filteredFiles.length > 0;
  const toggleAll = () => {
    if (allCollapsed) setCollapsedFiles([]);
    else setCollapsedFiles(filteredFiles.map(fullPath));
  };

  return (
    <div className="diff-shell">
      <FilesPanel
        collapsed={filesCollapsed}
        onToggle={() => setFilesCollapsed((c) => !c)}
        query={query}
        setQuery={setQuery}
        types={types}
        setTypes={setTypes}
        allTypes={allTypes}
        files={filteredFiles}
        activeFile={activeFile}
        setActiveFile={setActiveFile}
        collapsedFiles={collapsedFiles}
        scrollToFile={scrollToFile}
      />
      <div className="diff-main">
        <div className="diff-mh">
          <span className="diff-mh-l">
            <span className="dim">Diff ·</span>
            <span className="who flux">codex</span>
            <span className="dim">·</span>
            <span className="mono">
              <span className="pos">+{totalAdd}</span>{' '}
              <span className="neg">−{totalDel}</span>
            </span>
            <span className="dim">across</span>
            <span><b>{filteredFiles.length}</b> of {FILES.length} files</span>
          </span>
          <span className="diff-mh-r">
            <button className="diff-mh-btn" onClick={toggleAll} type="button">
              {allCollapsed ? 'Expand all' : 'Collapse all'}
            </button>
            <span className="dim">vf-1284-refactor-billing-reducer</span>
          </span>
        </div>
        <div className="diff-stream-wrap">
          <DiffStream
            files={filteredFiles}
            collapsedFiles={collapsedFiles}
            toggleFile={toggleFile}
            fileRefs={fileRefs}
          />
        </div>
      </div>
      <CommentsRail collapsed={commentsCollapsed} onToggle={() => setCommentsCollapsed((c) => !c)} />
    </div>
  );
}
