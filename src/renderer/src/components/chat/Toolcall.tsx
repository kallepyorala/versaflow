import { type ReactNode, useState } from 'react';
import { ICON_CHEV } from '@/icons';

interface ToolcallProps {
  name: ReactNode;
  arg: ReactNode;
  result?: ReactNode;
  ok?: boolean;
  lines?: ReactNode;
  defaultOpen?: boolean;
  children?: ReactNode;
}

export function Toolcall({ name, arg, result, ok = true, lines, defaultOpen = false, children }: ToolcallProps) {
  const [open, setOpen] = useState(!!defaultOpen && !!children);
  const hasBody = !!children;
  return (
    <div className="toolcall" data-open={open ? 'true' : 'false'}>
      <div
        className="th"
        onClick={() => { if (hasBody) setOpen((o) => !o); }}
        role={hasBody ? 'button' : undefined}
      >
        {hasBody && ICON_CHEV}
        <span className="name">{name}</span>
        <span className="arg">{arg}</span>
        {lines && <span className="lines">· {lines}</span>}
        {result !== undefined && (
          <span className={ok ? 'ok' : 'fail'} style={{ marginLeft: 'auto' }}>
            {ok ? '✓' : '✗'} {result}
          </span>
        )}
      </div>
      {hasBody && <div className="body-row">{children}</div>}
    </div>
  );
}
