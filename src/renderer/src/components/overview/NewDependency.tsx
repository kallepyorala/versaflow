interface NewDependencyProps {
  name: string;
  version: string;
  reason: string;
  size?: string;
  license?: string;
}

export function NewDependency({ name, version, reason, size, license }: NewDependencyProps) {
  return (
    <div className="ov-dep">
      <div className="ov-dep-glyph">{name.slice(0, 1).toUpperCase()}</div>
      <div className="ov-dep-main">
        <div className="ov-dep-title">
          <span className="lab">+ dep</span>
          {name} <span className="v">@ {version}</span>
        </div>
        <div className="ov-dep-reason">{reason}</div>
      </div>
      <div className="ov-dep-meta">
        {size && <span>{size}</span>}
        {license && <span className="ok">{license}</span>}
      </div>
    </div>
  );
}
