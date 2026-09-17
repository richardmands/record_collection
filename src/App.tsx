import { useEffect, useMemo, useRef, useState } from 'react';
import { AlbumCard } from './components/AlbumCard';
import { AlbumDetail } from './components/AlbumDetail';
import type { Album, Collection, Language, SortKey } from './types';
import { decade, displayText, genres, matchesSearch, sortAlbums } from './utils';
import './App.css';

function preference(key: string, fallback: string) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function selectedId() { return new URLSearchParams(location.search).get('album'); }
const emptyFilters = { artist: '', decade: '', genre: '', label: '', format: '', review: '' };

function App() {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('artistEn');
  const [descending, setDescending] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [language, setLanguage] = useState<Language>(() => preference('records-language', 'en') === 'ja' ? 'ja' : 'en');
  const [view, setView] = useState(() => preference('records-view', 'grid') === 'table' ? 'table' : 'grid');
  const [albumId, setAlbumId] = useState<string | null>(selectedId);
  const returnFocus = useRef<HTMLElement | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const albums = useMemo(() => collection?.albums || [], [collection]);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/data/collection.json', { signal: controller.signal })
      .then((res) => { if (!res.ok) throw new Error('Could not load the collection. Please try again.'); return res.json(); })
      .then(setCollection)
      .catch((e: Error) => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const onPop = () => setAlbumId(selectedId());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    try { localStorage.setItem('records-language', language); localStorage.setItem('records-view', view); } catch { /* Preferences are optional. */ }
  }, [language, view]);
  const selected = albums.find((a) => a.id === albumId);
  const isOpen = !!selected;
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    const main = mainRef.current;
    const focusTarget = returnFocus.current;
    document.body.style.overflow = 'hidden';
    if (main) main.inert = true;
    return () => {
      document.body.style.overflow = previous;
      if (main) main.inert = false;
      focusTarget?.focus();
    };
  }, [isOpen]);
  useEffect(() => {
    document.title = selected ? `${selected.titleEn || selected.titleJa} · Richard’s Records` : 'Richard’s Records · Japanese Vinyl';
  }, [selected]);

  function openAlbum(album: Album, replace = false) {
    if (!albumId) returnFocus.current = document.activeElement as HTMLElement;
    const url = new URL(location.href);
    url.searchParams.set('album', album.id);
    if (replace) history.replaceState(history.state, '', url);
    else history.pushState({ recordsAlbum: true }, '', url);
    setAlbumId(album.id);
  }
  function closeAlbum() {
    if (history.state?.recordsAlbum) history.back();
    else {
      const url = new URL(location.href);
      url.searchParams.delete('album');
      history.replaceState(null, '', url);
      setAlbumId(null);
    }
  }
  const filtered = useMemo(() => {
    const result = sortAlbums(albums.filter((a) =>
      matchesSearch(a, query) &&
      (!filters.artist || (a.artistEn || a.artistJa) === filters.artist) &&
      (!filters.decade || decade(a) === filters.decade) &&
      (!filters.genre || genres(a).includes(filters.genre)) &&
      (!filters.label || a.label === filters.label) &&
      (!filters.format || a.format === filters.format) &&
      (!filters.review || (filters.review === 'artwork' ? !a.coverImage : a.verificationIssues.length > 0))
    ), sort);
    return descending ? result.reverse() : result;
  }, [albums, query, sort, filters, descending]);
  const options = useMemo(() => {
    const unique = (items: string[]) => [...new Set(items.filter(Boolean))].sort((a,b) => a.localeCompare(b));
    return {
      artist: unique(albums.map(a => a.artistEn || a.artistJa)),
      decade: unique(albums.map(decade)),
      genre: unique(albums.flatMap(genres)),
      label: unique(albums.map(a => a.label)),
      format: unique(albums.map(a => a.format)),
    };
  }, [albums]);
  const selectedIndex = selected ? filtered.findIndex(a => a.id === selected.id) : -1;
  const activeFilters = !!query || Object.values(filters).some(Boolean);
  const clear = () => { setQuery(''); setFilters(emptyFilters); };
  return <div className="app">
    <header className="site-header"><div className="site-header__inner">
      <div className="brand"><span className="brand__disc" aria-hidden="true" /><div>
        <p className="brand__eyebrow">Richard’s collection</p><h1 className="brand__title">Japanese Vinyl</h1>
      </div></div>
      <p className="site-tagline">A personal collection, one record at a time.</p>
    </div></header>
    <main className="site-main" ref={mainRef}>
      <div className="collection-intro"><div><p className="eyebrow">THE RECORD SHELVES</p><h2>Find your next listen.</h2></div>
        <label className="control">Display language<select value={language} onChange={e => setLanguage(e.target.value as Language)}>
          <option value="en">English first</option><option value="ja">Japanese first</option>
        </select></label>
      </div>
      <div className="toolbar">
        <label className="toolbar__search"><span className="sr-only">Search collection</span>
          <input type="search" placeholder="Search artists, albums, tracks or catalogue numbers…" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <label className="toolbar__sort">Sort<select value={sort} onChange={e => setSort(e.target.value as SortKey)}>
          <option value="artistEn">Artist (English)</option><option value="artistJa">Artist (Japanese)</option>
          <option value="title">Album title</option><option value="year">Release year</option>
        </select></label>
        <button className="control-button" aria-label="Reverse sort order" aria-pressed={descending} onClick={() => setDescending(!descending)}>{descending ? '↓ Descending' : '↑ Ascending'}</button>
      </div>
      <div className="filters" aria-label="Filter collection">
        {(Object.keys(options) as (keyof typeof options)[]).map(key => <label className="control" key={key}>
          {key.charAt(0).toUpperCase() + key.slice(1)}<select value={filters[key]} onChange={e => setFilters({...filters, [key]: e.target.value})}>
            <option value="">All {key === 'decade' ? 'decades' : key === 'artist' ? 'artists' : key === 'genre' ? 'genres' : key === 'label' ? 'labels' : 'formats'}</option>
            {options[key].map(option => <option key={option}>{option}</option>)}
          </select></label>)}
        <label className="control">Catalogue status<select value={filters.review} onChange={e => setFilters({...filters, review: e.target.value})}>
          <option value="">All records</option><option value="verification">Needs verification</option><option value="artwork">Artwork pending</option>
        </select></label>
      </div>
      <div className="results-bar">
        <p role="status">{collection ? <><strong>{filtered.length}</strong>{filtered.length !== albums.length ? ` of ${albums.length}` : ''} albums</> : 'Loading collection…'}</p>
        {activeFilters && <button className="text-button" onClick={clear}>Clear filters</button>}
        <div className="view-switch" aria-label="Catalogue view">
          <button aria-pressed={view === 'grid'} onClick={() => setView('grid')}>Cover grid</button>
          <button aria-pressed={view === 'table'} onClick={() => setView('table')}>Table</button>
        </div>
      </div>
      {error && <div className="status status--error" role="alert">{error} <button onClick={() => location.reload()}>Retry</button></div>}
      {albumId && collection && !selected && <div className="status" role="alert">This record could not be found. <button onClick={closeAlbum}>Return to collection</button></div>}
      {collection && filtered.length === 0 && <div className="empty-state"><h2>No records found</h2><p>Try fewer words or clear your filters.</p><button className="control-button" onClick={clear}>Show all records</button></div>}
      {view === 'grid' ? <div className="album-grid">{filtered.map(a => <AlbumCard key={a.id} album={a} language={language} onSelect={openAlbum} />)}</div> :
        <div className="table-scroll"><table className="collection-table"><caption className="sr-only">Record collection</caption><thead><tr>
          <th scope="col">ID</th><th scope="col">Artist</th><th scope="col">Album</th><th scope="col">Year</th><th scope="col">Label</th><th scope="col">Catalogue</th><th scope="col">Shelf</th><th scope="col">Status</th>
        </tr></thead><tbody>{filtered.map(a => <tr key={a.id}>
          <td>{a.id}</td><td>{displayText(a.artistEn,a.artistJa,language)[0]}</td>
          <td><button className="text-button" onClick={() => openAlbum(a)}>{displayText(a.titleEn,a.titleJa,language)[0]}</button></td>
          <td>{a.year || 'Unknown'}</td><td>{a.label || '—'}</td><td>{a.catalogNumber || 'Unknown'}</td><td>{a.shelfLocation || '—'}</td>
          <td>{a.verificationIssues.length ? <span className="badge">Needs verification</span> : a.verificationStatus}</td>
        </tr>)}</tbody></table></div>}
    </main>
    <footer className="site-footer"><p>Richard’s Records{collection?.updatedAt && <> · Last updated <time dateTime={collection.updatedAt}>{new Date(collection.updatedAt + 'T12:00:00Z').toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</time></>}</p></footer>
    {selected && <AlbumDetail key={selected.id} album={selected} language={language} onClose={closeAlbum}
      onPrevious={selectedIndex > 0 ? () => openAlbum(filtered[selectedIndex-1], true) : undefined}
      onNext={selectedIndex >= 0 && selectedIndex < filtered.length-1 ? () => openAlbum(filtered[selectedIndex+1], true) : undefined} />}
  </div>;
}
export default App;
