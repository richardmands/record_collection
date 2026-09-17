import type { Album, SortKey } from './types';

export function coverUrl(filename: string | undefined): string | null {
  if (!filename) return null;
  // Cache-bust so online covers replace old photo crops after refresh
  return `/covers/${filename}?v=online2`;
}

export function initials(album: Album): string {
  const src = album.artistEn || album.artistJa || album.titleEn || '?';
  const parts = src.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return src.slice(0, 2).toUpperCase();
}

export function parseYear(year: string | undefined): number | null {
  if (!year) return null;
  const m = String(year).match(/\d{4}/);
  return m ? Number(m[0]) : null;
}

export function sortAlbums(albums: Album[], key: SortKey): Album[] {
  const copy = [...albums];
  copy.sort((a, b) => {
    if (key === 'year') {
      const ya = parseYear(a.year);
      const yb = parseYear(b.year);
      if (ya === null && yb === null) return a.id.localeCompare(b.id);
      if (ya === null) return 1;
      if (yb === null) return -1;
      if (ya !== yb) return ya - yb;
      return a.id.localeCompare(b.id);
    }
    if (key === 'artistEn') {
      const cmp = (a.artistEn || '').localeCompare(b.artistEn || '', 'en', {
        sensitivity: 'base',
      });
      return cmp || a.id.localeCompare(b.id);
    }
    if (key === 'artistJa') {
      const cmp = (a.artistJa || '').localeCompare(b.artistJa || '', 'ja');
      return cmp || a.id.localeCompare(b.id);
    }
    const ta = a.titleEn || a.titleJa || '';
    const tb = b.titleEn || b.titleJa || '';
    const cmp = ta.localeCompare(tb, 'en', { sensitivity: 'base' });
    return cmp || a.id.localeCompare(b.id);
  });
  return copy;
}

export function matchesSearch(album: Album, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    album.artistEn,
    album.artistJa,
    album.titleEn,
    album.titleJa,
    album.label,
    album.catalogNumber,
    album.genre,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function gradientForId(id: string): string {
  const h = 8 + (hash(id) % 48);
  const h2 = (h + 35) % 360;
  return `linear-gradient(145deg, hsl(${h} 58% 44%) 0%, hsl(${h2} 42% 20%) 100%)`;
}
