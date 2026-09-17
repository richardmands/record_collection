import type { Album, Track } from '../types';
import { CoverArt } from './CoverArt';

interface Props {
  album: Album;
  onClose: () => void;
}

function groupBySide(tracks: Track[]): { side: string; tracks: Track[] }[] {
  const order: string[] = [];
  const map = new Map<string, Track[]>();
  for (const t of tracks) {
    const side = t.side || '?';
    if (!map.has(side)) {
      map.set(side, []);
      order.push(side);
    }
    map.get(side)!.push(t);
  }
  return order.map((side) => ({
    side,
    tracks: map.get(side)!.slice().sort((a, b) => {
      const na = Number(a.number) || 0;
      const nb = Number(b.number) || 0;
      return na - nb;
    }),
  }));
}

export function AlbumDetail({ album, onClose }: Props) {
  const sides = groupBySide(album.tracks || []);
  const yearLabel =
    album.year && /\d{4}/.test(album.year)
      ? album.year.match(/\d{4}/)![0]
      : album.year || 'Unknown';

  return (
    <div
      className="detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="detail-panel">
        <button type="button" className="detail-close" onClick={onClose}>
          ← Back
        </button>

        <div className="detail-hero">
          <CoverArt album={album} size="detail" />
          <div className="detail-hero__text">
            <p className="detail-kicker">#{album.id}</p>
            <h1 id="detail-title" className="detail-title">
              {album.titleJa || album.titleEn}
            </h1>
            {album.titleEn && album.titleJa && album.titleEn !== album.titleJa && (
              <p className="detail-title-ja">{album.titleEn}</p>
            )}
            <p className="detail-artist">
              {album.artistJa || album.artistEn}
              {album.artistJa && album.artistEn && album.artistJa !== album.artistEn ? (
                <span className="detail-artist-ja"> / {album.artistEn}</span>
              ) : null}
            </p>
            <dl className="detail-facts">
              <div>
                <dt>Catalog</dt>
                <dd>{album.catalogNumber || '—'}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{yearLabel}</dd>
              </div>
              <div>
                <dt>Label</dt>
                <dd>{album.label || '—'}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>{album.format || '—'}</dd>
              </div>
              <div>
                <dt>Genre</dt>
                <dd>{album.genre || '—'}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{album.retailPriceJpy || '—'}</dd>
              </div>
            </dl>
            {album.discogsUrl && (
              <a
                className="detail-discogs"
                href={album.discogsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Search on Discogs ↗
              </a>
            )}
          </div>
        </div>

        {album.notes && (
          <section className="detail-notes">
            <h2>Notes</h2>
            <p>{album.notes}</p>
          </section>
        )}

        <section className="detail-tracks">
          <h2>Tracks</h2>
          {sides.length === 0 ? (
            <p className="muted">No track listing yet.</p>
          ) : (
            sides.map(({ side, tracks }) => (
              <div key={side} className="side-block">
                <h3 className="side-label">Side {side}</h3>
                <ol className="track-list">
                  {tracks.map((t) => (
                    <li key={`${side}-${t.number}-${t.titleEn || t.titleJa}`}>
                      <span className="track-num">{t.number}</span>
                      <span className="track-titles">
                        <span className="track-en">
                          {t.titleJa || t.titleEn}
                        </span>
                        {t.titleJa && t.titleEn && t.titleJa !== t.titleEn && (
                          <span className="track-ja">{t.titleEn}</span>
                        )}
                      </span>
                      {t.duration && (
                        <span className="track-dur">{t.duration}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
