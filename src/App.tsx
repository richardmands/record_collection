import { useEffect, useMemo, useState } from 'react'
import type { Album, Collection } from './types.ts'

type SortKey = 'id' | 'artist' | 'title'

function coverUrl(filename: string) {
  return `/covers/${filename}`
}

function displayArtist(album: Album) {
  return album.artistJa || album.artist || 'Unknown artist'
}

function displayTitle(album: Album) {
  return album.titleJa || album.title
}

function albumMatches(album: Album, query: string) {
  const haystack = [
    album.artist,
    album.artistJa,
    album.title,
    album.titleJa,
    album.label,
    album.catalog,
    String(album.id),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(query)
}

function readSelectedId() {
  const params = new URLSearchParams(window.location.search)
  const value = Number(params.get('id'))
  return Number.isFinite(value) && value > 0 ? value : null
}

export default function App() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [selectedId, setSelectedId] = useState<number | null>(readSelectedId)

  useEffect(() => {
    let cancelled = false
    fetch('/data/collection.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load collection (${res.status})`)
        return res.json() as Promise<Collection>
      })
      .then((data) => {
        if (!cancelled) setAlbums(data.albums ?? [])
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load collection')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (selectedId) params.set('id', String(selectedId))
    else params.delete('id')
    const next = `${window.location.pathname}${params.size ? `?${params}` : ''}`
    window.history.replaceState(null, '', next)
  }, [selectedId])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = needle ? albums.filter((album) => albumMatches(album, needle)) : albums
    return [...filtered].sort((a, b) => {
      if (sortKey === 'id') return a.id - b.id
      const left = (sortKey === 'artist' ? displayArtist(a) : displayTitle(a)).toLowerCase()
      const right = (sortKey === 'artist' ? displayArtist(b) : displayTitle(b)).toLowerCase()
      return left.localeCompare(right, 'ja')
    })
  }, [albums, query, sortKey])

  const selected = albums.find((album) => album.id === selectedId) ?? null

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <p className="eyebrow">Richard Mands</p>
          <h1>
            Record Collection
            <span className="ja-title">レコードコレクション</span>
          </h1>
        </div>
        <div className="toolbar">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Artist, title, label…"
            autoComplete="off"
          />
          <label htmlFor="sort">Sort</label>
          <select
            id="sort"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
          >
            <option value="id">Shelf number</option>
            <option value="artist">Artist</option>
            <option value="title">Title</option>
          </select>
        </div>
      </header>

      {error ? (
        <p className="status error">{error}</p>
      ) : (
        <p className="status">
          {visible.length} of {albums.length} records
        </p>
      )}

      <section className="grid" aria-label="Album covers">
        {visible.map((album) => (
          <button
            key={album.id}
            type="button"
            className="card"
            onClick={() => setSelectedId(album.id)}
          >
            <div className="sleeve">
              <img src={coverUrl(album.cover)} alt={`${displayArtist(album)} — ${displayTitle(album)}`} />
            </div>
            <div className="meta">
              <p className="artist">{displayArtist(album)}</p>
              <p className="title">{displayTitle(album)}</p>
            </div>
          </button>
        ))}
      </section>

      {selected ? (
        <div
          className="backdrop"
          role="presentation"
          onClick={() => setSelectedId(null)}
        >
          <article
            className="detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="album-title"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={coverUrl(selected.cover)}
              alt={`${displayArtist(selected)} — ${displayTitle(selected)}`}
            />
            <div className="detail-copy">
              <p className="eyebrow">No. {String(selected.id).padStart(2, '0')}</p>
              <h2 id="album-title">{displayTitle(selected)}</h2>
              {selected.titleJa && selected.title !== selected.titleJa ? (
                <p className="ja">{selected.title}</p>
              ) : null}
              <p className="ja">
                {displayArtist(selected)}
                {selected.artist && selected.artistJa ? ` / ${selected.artist}` : ''}
              </p>
              <ul className="facts">
                {selected.label ? (
                  <li>
                    <span>Label</span>
                    {selected.label}
                  </li>
                ) : null}
                {selected.catalog ? (
                  <li>
                    <span>Catalog</span>
                    {selected.catalog}
                  </li>
                ) : null}
              </ul>
              <button type="button" className="close" onClick={() => setSelectedId(null)}>
                Close
              </button>
            </div>
          </article>
        </div>
      ) : null}

      <footer className="footer">
        Static collection browser. Data lives in <code>public/data/collection.json</code>.
      </footer>
    </div>
  )
}
