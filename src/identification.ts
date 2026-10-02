import research from '../data/research/retail-research.json';
import type { Album } from './types';

// Retailer evidence supplements the original photo catalogue independently of Discogs.
export function withIdentification(album: Album): Album {
  if (album.id === '68') album = { ...album, artistEn: 'Kasugai Baio', artistJa: '春日井梅鶯', artistInfoUrl: 'https://www.discogs.com/search/?q=Kasugai+Baio&type=artist', artistInfoLabel: 'Discogs artist search', researchNotes: research.find(row => row.id === '68')?.note || album.researchNotes, summary: 'Rokyoku Meijinsen: Nanbuzaka Yuki no Wakare / Adauchi Zenya. The performer name printed on the reference sleeve is Kasugai Baio (春日井梅鶯).', summarySource: album.coverSource, summarySourceLabel: 'Original reference sleeve' };
  const evidence = research.find(row => row.id === album.id && row.status === 'Cover matched');
  if (!evidence) return album;
  const years: Record<string, string> = { '34': '1975', '43': '1972', '141': '1972' };
  return {
    ...album,
    ...(album.id === '72' ? { artistEn: 'Hachiro Kasuga', artistJa: '春日八郎', titleEn: 'Best 20', titleJa: 'ベスト20', catalogNumber: 'SSS-1', label: 'King', summary: 'Hachiro Kasuga compilation with 20 songs, identified from the matching King Records sleeve and obi.', summarySource: evidence.sources[0], summarySourceLabel: 'Mercari shop listing', artistInfoUrl: 'https://www.discogs.com/search/?q=Hachiro+Kasuga&type=artist', artistInfoLabel: 'Discogs artist search' } : {}),
    ...(album.id === '80' ? { titleEn: 'The Best', catalogNumber: '40AH837–8', label: 'CBS/Sony', format: '2LP' } : {}),
    ...(album.id === '78' ? { catalogNumber: 'LW-5040', label: 'Crown' } : {}),
    ...(album.id === '132' ? { titleEn: 'The Best', catalogNumber: '25AH749', year: '1979', label: 'CBS/Sony' } : {}),
    ...(album.id === '131' ? { titleEn: 'Best 24 Deluxe Volume 2', titleJa: 'ベスト24デラックス第2集', catalogNumber: 'JRS-9181–82', year: '1973', label: 'RCA', format: '2LP' } : {}),
    ...(album.id === '140' ? { titleJa: '歌は生きている 美空ひばりゴールデンヒットアルバム', titleEn: 'Uta wa Ikiteiru / Golden Hit Album', catalogNumber: 'ALS-4133–4', label: 'Columbia', format: '2LP', summary: 'A two-LP Hibari Misora compilation identified by its white-kimono and moon sleeve. The retailer lists a release year of 1965.', summarySource: evidence.sources[0], summarySourceLabel: 'eBay listing' } : {}),
    ...(album.id === '119' ? { artistEn: 'Marlene', artistJa: 'マリーン', artistInfoUrl: 'https://www.discogs.com/search/?q=Marlene&type=artist', artistInfoLabel: 'Discogs artist search', summary: 'Deja Vu by Marlene. The pink sofa sleeve matches the retailer reference, catalogue 28AH1514.', summarySource: evidence.sources[0], summarySourceLabel: 'Snow Records' } : {}),
    year: years[album.id] || ({ '140':'1965', '132':'1979', '131':'1973' } as Record<string,string>)[album.id] || album.year,
    identification: { status: 'Identified · not linked to Discogs', note: evidence.note, sources: evidence.sources, programme: evidence.programme },
  };
}
