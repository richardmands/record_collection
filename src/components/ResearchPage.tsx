import { useEffect, useState } from 'react';
import unresolved from '../../data/research/discogs-unresolved.json';
import type { Collection } from '../types';
import { coverUrl } from '../utils';
import './ResearchPage.css';

type Answer = { url: string; notes: string };
const storageKey = 'records-research-links-v1';
function savedAnswers(): Record<string, Answer> {
  try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; } catch { return {}; }
}
export function ResearchPage() {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState(savedAnswers);
  const [query, setQuery] = useState('');
  const [onlyRemaining, setOnlyRemaining] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    document.title = 'Help identify records · Richard’s Records';
    const controller = new AbortController();
    fetch('/data/collection.json', { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Could not load album details. Please reload.'); return r.json(); }).then(setCollection).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, []);
  function update(id: string, field: keyof Answer, value: string) {
    const next = { ...answers, [id]: { ...(answers[id] || { url: '', notes: '' }), [field]: value } };
    setAnswers(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); }
  }
  function download() {
    const results = unresolved.filter(r => answers[r.id]?.url || answers[r.id]?.notes).map(r => ({ id: r.id, artist: r.artist, title: r.title, ...answers[r.id] }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'richards-records-research-links.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const count = unresolved.filter(r => answers[r.id]?.url?.trim()).length;
  const visible = unresolved.filter(r => (!onlyRemaining || !answers[r.id]?.url?.trim()) && `${r.id} ${r.artist} ${r.title}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="research-page">
    <a href="/">← Back to collection</a>
    <h1>Help identify these records</h1>
    <p>35 records need a Discogs match. Compare the cover and track list, then add any useful link or notes. A matching album is enough; the exact pressing can differ.</p>
    <p>Your entries save in this browser on this device. They aren’t submitted automatically. When ready, download your links and attach the file in our chat.</p>
    <div className="research-tools"><label>Find a record<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Artist, title or ID" /></label><label><input type="checkbox" checked={onlyRemaining} onChange={e => setOnlyRemaining(e.target.checked)} /> Only records without a link</label><button onClick={download}>Download my links ({count}/35)</button></div>
    {storageError && <p role="alert">This browser couldn’t save your entries. Download your links before closing this page.</p>}
    {error && <p role="alert">{error}</p>}
    {!collection && !error && <p role="status">Loading covers and details…</p>}
    <div className="research-grid">{visible.map(record => {
      const album = collection?.albums.find(a => a.id === record.id);
      const search = [album?.artistJa || record.artist, album?.titleJa || record.title, album?.catalogNumber].filter(Boolean).join(' ');
      const candidates = [...new Map(record.searches.flatMap(s => s.candidates).map(c => [c.url, c])).values()];
      return <article key={record.id} className="research-card">
        {album?.coverImage && <a href={coverUrl(album.coverImage)!} target="_blank" rel="noreferrer" aria-label={`Enlarge cover for record ${record.id}`}><img className="research-cover" src={coverUrl(album.coverImage)!} alt={`${record.artist}: ${record.title}`} loading="lazy" /></a>}
        <div className="research-content"><small>Record {record.id}{answers[record.id]?.url?.trim() ? ' · Link saved' : ''}</small><h2>{record.title}</h2><p>{record.artist}</p>
        {record.id === '119' && <p className="research-hint">Possible correction: the artist may be Marlene rather than Miki Matsubara.</p>}
        {album && <><p lang="ja">{album.artistJa} · {album.titleJa}</p><dl>{[['Year', album.year], ['Label', album.label], ['Catalogue', album.catalogNumber], ['Format', album.format], ['Country', album.country]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Unknown'}</dd></div>)}</dl>{album.notes && <p>{album.notes}</p>}</>}
        <nav aria-label={`Search for record ${record.id}`}><a target="_blank" rel="noreferrer" href={`https://www.google.co.jp/search?q=${encodeURIComponent(search)}`}>Search Google Japan ↗</a><a target="_blank" rel="noreferrer" href={`https://www.discogs.com/search/?q=${encodeURIComponent(search)}&type=release`}>Search Discogs ↗</a><a href={`/?album=${record.id}`} target="_blank" rel="noreferrer">Album view ↗</a></nav>
        {record.sources.length > 0 && <div><strong>Sources you found</strong>{record.sources.map(source => <p key={source}><a href={source} target="_blank" rel="noreferrer">Open reference listing ↗</a></p>)}</div>}
        <details><summary>Research notes and possible matches ({candidates.length})</summary><p>{record.reason}</p>{candidates.map(c => <p key={c.url}><a href={c.url} target="_blank" rel="noreferrer">{c.title}</a> · {c.catalogue || 'No catalogue number'}</p>)}</details>
        {album && <details><summary>Known track list ({album.tracks.length})</summary>{album.tracks.length ? <ol>{album.tracks.map((t, i) => <li key={i}>{t.side}{t.number} · {t.titleJa || t.titleEn}{t.titleJa && t.titleEn ? ` / ${t.titleEn}` : ''}</li>)}</ol> : <p>No tracks recorded yet.</p>}</details>}
        <label>Link you found<input type="url" maxLength={2000} placeholder="https://…" value={answers[record.id]?.url || ''} onChange={e => update(record.id, 'url', e.target.value)} /></label><label>Your notes<textarea rows={3} maxLength={4000} placeholder="Correct title, artist, year, or anything useful…" value={answers[record.id]?.notes || ''} onChange={e => update(record.id, 'notes', e.target.value)} /></label>
        </div></article>;
    })}</div>
    {!visible.length && <p>No records match this filter.</p>}
  </main>;
}
