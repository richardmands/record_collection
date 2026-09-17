import { useEffect, useMemo, useState } from 'react';
import { AlbumCard } from './components/AlbumCard';
import { AlbumDetail } from './components/AlbumDetail';
import { Toolbar } from './components/Toolbar';
import type { Album, Collection, SortKey } from './types';
import { matchesSearch, sortAlbums } from './utils';
import './App.css';

function App() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('artistEn');
  const [selected, setSelected] = useState<Album | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/data/collection.json');
        if (!res.ok) throw new Error(`Failed to load collection (${res.status})`);
        const data: Collection = await res.json();
        if (!cancelled) {
          setAlbums(data.albums || []);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [selected]);

  const filtered = useMemo(() => {
    const matched = albums.filter((a) => matchesSearch(a, query));
    return sortAlbums(matched, sort);
  }, [albums, query, sort]);

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header__inner">
          <div className="brand">
            <span className="brand__disc" aria-hidden="true" />
            <div>
              <p className="brand__eyebrow">Richard’s collection</p>
              <h1 className="brand__title">Japanese Vinyl</h1>
            </div>
          </div>
          <p className="site-tagline">
            Enka, kayōkyoku &amp; folk LPs — bilingual catalog
          </p>
        </div>
      </header>

      <main className="site-main">
        <Toolbar
          query={query}
          onQuery={setQuery}
          sort={sort}
          onSort={setSort}
          count={filtered.length}
          total={albums.length}
        />

        {loading && <p className="status">Loading collection…</p>}
        {error && <p className="status status--error">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <p className="status">No albums match “{query}”.</p>
        )}

        <div className="album-grid">
          {filtered.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onSelect={setSelected}
            />
          ))}
        </div>
      </main>

      <footer className="site-footer">
        <p>
          Local catalog browser · data from{' '}
          <code>public/data/collection.json</code>
        </p>
      </footer>

      {selected && (
        <AlbumDetail album={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export default App;
