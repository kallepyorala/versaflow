import type { FileEntry } from '@/types';

export function fileExt(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1] : '';
}

export function fullPath(f: FileEntry): string {
  return f.path[0] + f.path[1];
}

export function truncateMiddle(s: string, max: number): string {
  if (!s || s.length <= max) return s;
  const keep = max - 1;
  const head = Math.ceil(keep * 0.55);
  const tail = keep - head;
  return s.slice(0, head) + '…' + s.slice(-tail);
}
