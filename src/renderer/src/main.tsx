import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { hydrate, getIssuesByStatus } from '@/store/store';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// Throwaway smoke check for the renderer store skeleton (issue #16).
// Hydrates a tiny BootSnapshot and logs the by-status selector result.
// Removed once a real bootstrap source lands.
if (import.meta.env.DEV) {
  const now = Date.now();
  hydrate({
    workspace: { id: 1, name: 'smoke', rootPath: '/tmp/smoke' },
    context: {},
    issues: [
      { id: 1, workspaceId: 1, providerId: 1, externalId: 'x1', externalKey: 'VF-1',
        title: 'a', bodyMd: null, status: 'todo', statusRaw: null, priority: null,
        assigneeExternalId: null, assigneeName: null, url: null, hot: null,
        archived: false, updatedAtRemote: null, fetchedAt: now },
      { id: 2, workspaceId: 1, providerId: 1, externalId: 'x2', externalKey: 'VF-2',
        title: 'b', bodyMd: null, status: 'todo', statusRaw: null, priority: null,
        assigneeExternalId: null, assigneeName: null, url: null, hot: null,
        archived: false, updatedAtRemote: null, fetchedAt: now },
      { id: 3, workspaceId: 1, providerId: 1, externalId: 'x3', externalKey: 'VF-3',
        title: 'c', bodyMd: null, status: 'in_progress', statusRaw: null, priority: null,
        assigneeExternalId: null, assigneeName: null, url: null, hot: null,
        archived: false, updatedAtRemote: null, fetchedAt: now },
    ],
    worktrees: [], prs: [], comments: [], checks: [], sessions: [], ticker: [], uiState: {},
  });
  console.info('[store smoke] todo issues:', getIssuesByStatus('todo').map((i) => i.externalKey));
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
