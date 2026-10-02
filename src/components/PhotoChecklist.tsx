import { useEffect, useState } from 'react';
import type { Album, Collection } from '../types';
import { coverUrl, uniqueEditions } from '../utils';
import { withIdentification } from '../identification';
import discogsDetails from '../../data/research/discogs-enrichment.json';
import unresolved from '../../data/research/discogs-unresolved.json';
import './ResearchPage.css';

const pending = new Set(unresolved.map(row => row.id));
const storageKey = 'records-label-photos-v1';
function reasons(album: Album): string[] {
  const result: string[] = [];
  if (pending.has(album.id)) result.push('Confirm the album title, artist, catalogue and programme.');
  if (!album.tracks.length && !album.discogs?.tracks.length) result.push('Read the track titles and their A/B side order.');
  if (!album.year && !album.discogs?.year) result.push('Check for a printed date (the label may not show a release year).');
  return result;
}
export function PhotoChecklist() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [hideDone, setHideDone] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });
  useEffect(() => {
    document.title = 'Record label photo checklist · Richard’s Records';
    const controller = new AbortController();
    fetch('/data/collection.json', { signal: controller.signal }).then(r => {
      if (!r.ok) throw new Error('Could not load the checklist. Please reload.');
      return r.json();
    }).then((data: Collection) => setAlbums(uniqueEditions(data.albums.map(album => ({ ...withIdentification(album), discogs: (discogsDetails as Record<string, Album['discogs']>)[album.id] }))).filter(album => reasons(album).length).sort((a,b) => Number(a.id)-Number(b.id))))
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, []);
  function toggle(id: string, value: boolean) {
    const next = { ...done, [id]: value }; setDone(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { setError('Ticks could not be saved in this browser.'); }
  }
  const visible = albums.filter(a => (!hideDone || !done[a.id]) && `${a.id} ${a.artistEn} ${a.artistJa} ${a.titleEn} ${a.titleJa}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="research-page">
    <a href="/">← Back to collection</a><h1>Record label photo checklist</h1>
    <p>Photograph the centre label on both sides, upright, in focus and without glare. Include the whole label so the catalogue number, side, credits and song titles are readable. For a double LP, photograph all four labels; for larger sets, every side.</p>
    <p>A back cover or insert is also useful when tracks or credits are missing from the labels. Dates and exact editions sometimes require the small writing in the runout near the label. We’ll only request that if needed.</p>
    <p>{albums.length} albums would benefit from label photos · {albums.filter(a => done[a.id]).length} marked photographed. Duplicate copies are combined unless known edition details differ. Ticks save on this device only; send the photos in our chat.</p>
    <div className="research-tools"><label>Find an album<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Artist, title or record number" /></label><label><input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} /> Hide photographed</label></div>
    {error && <p role="alert">{error}</p>}
    <div className="research-grid">{visible.map(album => <article className="research-card" key={album.id}>
      {album.coverImage && <a href={coverUrl(album.coverImage)!} target="_blank" rel="noreferrer"><img className="research-cover" src={coverUrl(album.coverImage)!} alt={`${album.artistEn}: ${album.titleEn}`} loading="lazy" /></a>}
      <div className="research-content"><small>Record #{album.id} · {album.format}</small><h2>{album.titleEn || album.titleJa}</h2><p>{album.artistEn || album.artistJa}</p><p lang="ja">{album.titleJa}</p><ul>{reasons(album).map(reason => <li key={reason}>{reason}</li>)}</ul><p><strong>Take:</strong> all side labels, plus the back cover or track insert if available.</p><a href={`/?album=${album.id}`}>View album details ↗</a><label><span><input type="checkbox" checked={!!done[album.id]} onChange={e => toggle(album.id,e.target.checked)} /> Photographed</span></label></div>
    </article>)}</div>
  </main>;
}
