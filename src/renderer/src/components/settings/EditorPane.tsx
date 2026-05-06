import { SettingsCard } from './shared';

export type EditorId = 'zed' | 'code' | 'cursor' | 'nvim' | 'idea';

export function EditorPane({ editor, setEditor }: { editor: EditorId; setEditor: (e: EditorId) => void }) {
  const editors: { id: EditorId; name: string; path: string; detected: boolean }[] = [
    { id: 'zed',    name: 'Zed',                 path: '/Applications/Zed.app',                  detected: true  },
    { id: 'code',   name: 'Visual Studio Code',  path: '/Applications/Visual Studio Code.app',   detected: true  },
    { id: 'cursor', name: 'Cursor',              path: '/Applications/Cursor.app',               detected: true  },
    { id: 'nvim',   name: 'Neovim (terminal)',   path: '/usr/local/bin/nvim',                    detected: true  },
    { id: 'idea',   name: 'JetBrains Toolbox',   path: '—',                                      detected: false },
  ];
  return (
    <SettingsCard
      title="External editor"
      sub="Pick the editor Versaflow opens worktrees in. Detected automatically from your PATH and Applications folder."
    >
      <div className="editor-list">
        {editors.map((e) => (
          <button
            key={e.id}
            className={`editor-row ${editor === e.id ? 'active' : ''} ${e.detected ? '' : 'disabled'}`}
            disabled={!e.detected}
            onClick={() => { if (e.detected) setEditor(e.id); }}
          >
            <span className="editor-radio" />
            <span className="editor-name">{e.name}</span>
            <span className="editor-path">{e.path}</span>
            {e.detected
              ? <span className="editor-badge ok">detected</span>
              : <span className="editor-badge muted">not found</span>}
          </button>
        ))}
      </div>
    </SettingsCard>
  );
}
