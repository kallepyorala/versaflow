import { useState } from 'react';

type PermPath = string | { prefix: string; name: string };

interface PermissionRequestProps {
  verb: string;
  path: PermPath;
  defaultState?: 'pending' | 'approved' | 'denied';
}

export function PermissionRequest({ verb, path, defaultState = 'pending' }: PermissionRequestProps) {
  const [state, setState] = useState(defaultState);
  return (
    <div className="perm" data-state={state}>
      <div className="label">
        <span className="eyebrow">Permission request</span>
        <span className="what">
          <span className="verb">{verb}</span>{' '}
          <span className="path">
            {typeof path === 'string'
              ? path
              : (<><span>{path.prefix}</span><b>{path.name}</b></>)}
          </span>
        </span>
      </div>
      <div className="actions">
        {state === 'pending' && (
          <>
            <button className="btn-deny" onClick={() => setState('denied')}>Deny</button>
            <button className="btn-allow" onClick={() => setState('approved')}>Allow</button>
          </>
        )}
        {state === 'approved' && <span>✓ Allowed</span>}
        {state === 'denied' && <span>✗ Denied</span>}
      </div>
    </div>
  );
}
