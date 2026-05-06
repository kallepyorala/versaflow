import { SettingsCard, FieldLabel } from './shared';

interface Repo {
  team: string;
  code: string;
  path: string;
  worktree: string;
  setup: string;
  status: 'configured' | 'needs-worktree' | 'unmapped';
}

const REPOS: Repo[] = [
  { team: 'AI CFO',   code: 'AIC', path: '/Users/kalle/Projects/Scaleup/nume-versaflow/main', worktree: '/Users/kalle/Projects/Scaleup/nume-versaflow/worktrees', setup: 'pnpm install', status: 'configured' },
  { team: 'nume-dev', code: 'DEV', path: '/Users/kalle/Projects/training/nume-dev',           worktree: '/Users/kalle/Projects/training/nume-dev/worktrees',          setup: 'pnpm install && pnpm prisma generate', status: 'configured' },
  { team: 'Web',      code: 'WEB', path: '/Users/kalle/Projects/Scaleup/scaleup-web',         worktree: '—',                                                          setup: '', status: 'needs-worktree' },
  { team: 'Infra',    code: 'INF', path: '—',                                                  worktree: '—',                                                          setup: '', status: 'unmapped' },
];

interface ReposPaneProps {
  editingRepo: string | null;
  setEditingRepo: (r: string | null) => void;
}

export function ReposPane({ editingRepo, setEditingRepo }: ReposPaneProps) {
  return (
    <SettingsCard
      title="Repositories"
      sub="Map each Linear team to a local git repository, a directory for worktrees, and an optional setup command."
    >
      <div className="repo-list">
        {REPOS.map((r) => (
          <RepoRow
            key={r.team}
            repo={r}
            expanded={editingRepo === r.team}
            onToggle={() => setEditingRepo(editingRepo === r.team ? null : r.team)}
          />
        ))}
      </div>
    </SettingsCard>
  );
}

function RepoRow({ repo, expanded, onToggle }: { repo: Repo; expanded: boolean; onToggle: () => void }) {
  const labels = { configured: 'Configured', 'needs-worktree': 'Needs worktree', unmapped: 'Unmapped' };
  const tones  = { configured: 'ok',         'needs-worktree': 'warn',           unmapped: 'muted' };
  return (
    <div className={`repo-row ${expanded ? 'expanded' : ''}`}>
      <button className="repo-row-h" onClick={onToggle}>
        <span className="repo-team">{repo.team} <span className="repo-code">({repo.code})</span></span>
        <span className={`repo-status ${tones[repo.status]}`}>{labels[repo.status]}</span>
        <svg className="repo-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div className="repo-row-body">
          <FieldLabel label="Repository path">
            <div className="settings-input-row">
              <input
                className="settings-input mono"
                defaultValue={repo.path === '—' ? '' : repo.path}
                placeholder="/path/to/repo"
              />
              <button className="settings-btn">Browse…</button>
            </div>
            {repo.path !== '—' && <span className="settings-hint ok">Git repository detected (.git found).</span>}
          </FieldLabel>
          <FieldLabel label="Worktree root">
            <div className="settings-input-row">
              <input
                className="settings-input mono"
                defaultValue={repo.worktree === '—' ? '' : repo.worktree}
                placeholder="/path/to/worktrees"
              />
              <button className="settings-btn">Browse…</button>
            </div>
          </FieldLabel>
          <FieldLabel label="Setup command" hint="(optional)">
            <input className="settings-input mono" defaultValue={repo.setup} placeholder="pnpm install" />
            <span className="settings-hint">Runs once when a worktree is created.</span>
          </FieldLabel>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="settings-btn ghost">Cancel</button>
            <button className="settings-btn primary">Update</button>
          </div>
        </div>
      )}
    </div>
  );
}
