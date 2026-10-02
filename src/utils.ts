import type { Album, SortKey, Language } from './types';

export function coverUrl(filename: string | undefined): string | null {
  if (!filename) return null;
  return `/covers/${encodeURIComponent(filename)}`;
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
  const byTitle = (a: Album, b: Album) => normalizeSearch(a.titleEn || a.titleJa || '').localeCompare(normalizeSearch(b.titleEn || b.titleJa || ''), 'en') || a.id.localeCompare(b.id, 'en', { numeric: true });
  const byYear = (a: Album, b: Album) => {
    const ya = parseYear(a.year);
    const yb = parseYear(b.year);
    if (ya === null && yb === null) return byTitle(a, b);
    if (ya === null) return 1;
    if (yb === null) return -1;
    return ya - yb || byTitle(a, b);
  };
  copy.sort((a, b) => {
    if (key === 'year') {
      return byYear(a, b);
    }
    if (key === 'artistEn') {
      const cmp = (a.artistEn || '').localeCompare(b.artistEn || '', 'en', {
        sensitivity: 'base',
      });
      return cmp || byYear(a, b);
    }
    if (key === 'artistJa') {
      const cmp = (a.artistJa || '').localeCompare(b.artistJa || '', 'ja');
      return cmp || byYear(a, b);
    }
    const ta = a.titleEn || a.titleJa || '';
    const tb = b.titleEn || b.titleJa || '';
    const cmp = ta.localeCompare(tb, 'en', { sensitivity: 'base' });
    return cmp || a.id.localeCompare(b.id);
  });
  return copy;
}

export function matchesSearch(album: Album, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const hay = [
    album.artistEn,
    album.artistJa,
    album.titleEn,
    album.titleJa,
    album.label,
    album.catalogNumber,
    album.genre,
    album.id,
    album.year,
    ...album.tracks.flatMap((t) => [t.titleEn, t.titleJa]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const normalized = normalizeSearch(hay);
  return q.split(/\s+/).every((word) => normalized.includes(word));
}

export function uniqueEditions(albums: Album[]): Album[] {
  const result: Album[] = [];
  const same = (a: string, b: string) => !a || !b || normalizeSearch(a).replaceAll(' ', '') === normalizeSearch(b).replaceAll(' ', '');
  for (const album of albums) {
    const duplicate = result.some(a =>
      normalizeSearch(a.artistEn || a.artistJa) === normalizeSearch(album.artistEn || album.artistJa) &&
      normalizeSearch(a.titleEn || a.titleJa) === normalizeSearch(album.titleEn || album.titleJa) &&
      same(a.catalogNumber, album.catalogNumber) && same(a.format, album.format) &&
      same(a.year, album.year) && same(a.country, album.country) && same(a.label, album.label));
    if (!duplicate) result.push(album);
  }
  return result;
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

export function displayText(en: string, ja: string, language: Language): [string, string] {
  const primary = (language === 'en' ? en : ja) || en || ja || 'Not identified';
  const secondary = language === 'en' ? ja : en;
  return [primary, secondary === primary ? '' : secondary];
}

export function decade(album: Album): string {
  const year = parseYear(album.year);
  return year ? `${Math.floor(year / 10) * 10}s` : 'Unknown';
}

export function genres(album: Album): string[] {
  return album.genre.split('/').map((s) => s.trim()).filter(Boolean);
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
