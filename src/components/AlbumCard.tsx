import type { Album } from '../types';
import { CoverArt } from './CoverArt';

interface Props {
  album: Album;
  onSelect: (album: Album) => void;
}

export function AlbumCard({ album, onSelect }: Props) {
  const year =
    album.year && /\d{4}/.test(album.year) ? album.year.match(/\d{4}/)![0] : '—';

  return (
    <button
      type="button"
      className="album-card"
      onClick={() => onSelect(album)}
    >
      <CoverArt album={album} size="card" />
      <div className="album-card__meta">
        <h2 className="album-card__title">
          {album.titleJa || album.titleEn}
        </h2>
        {album.titleEn && album.titleJa && album.titleEn !== album.titleJa && (
          <p className="album-card__title-ja">{album.titleEn}</p>
        )}
        <p className="album-card__artist">
          {album.artistJa || album.artistEn}
          {album.artistJa && album.artistEn && album.artistJa !== album.artistEn ? (
            <span className="album-card__artist-ja"> · {album.artistEn}</span>
          ) : null}
        </p>
        <p className="album-card__year">{year}</p>
      </div>
    </button>
  );
}
