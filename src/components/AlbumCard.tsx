import type { Album, Language } from '../types';
import { CoverArt } from './CoverArt';
import { displayText } from '../utils';

export function AlbumCard({ album, language, onSelect }: {
  album: Album; language: Language; onSelect: (album: Album) => void;
}) {
  const [title, subtitle] = displayText(album.titleEn, album.titleJa, language);
  const [artist, otherArtist] = displayText(album.artistEn, album.artistJa, language);
  return <button className="album-card" onClick={() => onSelect(album)}>
    <CoverArt album={album} />
    <div className="album-card__meta">
      <p className="album-card__artist">{artist}</p>
      {otherArtist && <p className="secondary" lang={language === 'en' ? 'ja' : 'en'}>{otherArtist}</p>}
      <h2 className="album-card__title">{title}</h2>
      {subtitle && <p className="album-card__title-ja" lang={language === 'en' ? 'ja' : 'en'}>{subtitle}</p>}
      <p className="album-card__year">{album.year || 'Year unknown'} · #{album.id}</p>
      {album.verificationIssues.length > 0 && <span className="badge">Needs verification</span>}
    </div>
  </button>;
}
