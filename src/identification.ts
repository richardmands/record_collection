import research from '../data/research/retail-research.json';
import type { Album } from './types';

// Retailer evidence supplements the original photo catalogue independently of Discogs.
export function withIdentification(album: Album): Album {
  const evidence = research.find(row => row.id === album.id && row.status === 'Cover matched');
  if (!evidence) return album;
  const years: Record<string, string> = { '34': '1975', '43': '1972', '141': '1972' };
  return {
    ...album,
    ...(album.id === '119' ? { artistEn: 'Marlene', artistJa: 'マリーン', artistInfoUrl: 'https://www.discogs.com/search/?q=Marlene&type=artist', artistInfoLabel: 'Discogs artist search', summary: 'Deja Vu by Marlene. The pink sofa sleeve matches the retailer reference, catalogue 28AH1514.', summarySource: evidence.sources[0], summarySourceLabel: 'Snow Records' } : {}),
    year: years[album.id] || album.year,
    identification: { status: 'Identified · not linked to Discogs', note: evidence.note, sources: evidence.sources, programme: evidence.programme },
  };
}
