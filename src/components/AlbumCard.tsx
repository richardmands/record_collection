import type { Album, Language } from '../types';
import { CoverArt } from './CoverArt';
import { displayText } from '../utils';

export function AlbumCard({ album, language, onSelect, onArtistSelect }: {
  album: Album; language: Language; onSelect: (album: Album) => void; onArtistSelect: (album: Album) => void;
}) {
  const [title, subtitle] = displayText(album.titleEn, album.titleJa, language);
  const [artist, otherArtist] = displayText(album.artistEn, album.artistJa, language);
  return <article className="album-card">
    <button className="album-card__open" onClick={() => onSelect(album)} aria-label={`View ${title}`}><CoverArt album={album} /></button>
    <div className="album-card__meta">
      <p className="album-card__artist"><button className="artist-link" onClick={() => onArtistSelect(album)} aria-label={`View all albums by ${artist}`}>{artist}</button></p>
      {otherArtist && <p className="secondary" lang={language === 'en' ? 'ja' : 'en'}>{otherArtist}</p>}
      <h2 className="album-card__title"><button className="album-card__open" onClick={() => onSelect(album)}>{title}</button></h2>
      {subtitle && <p className="album-card__title-ja" lang={language === 'en' ? 'ja' : 'en'}>{subtitle}</p>}
      <p className="album-card__year">{album.year || 'Year unknown'} · #{album.id}</p>
      {album.verificationIssues.length > 0 && <span className="badge">Needs verification</span>}
    </div>
  </article>;
}
