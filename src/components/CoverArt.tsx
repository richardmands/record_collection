import { useState } from 'react';
import type { Album } from '../types';
import { coverUrl, gradientForId, initials } from '../utils';

interface Props {
  album: Album;
  size?: 'card' | 'detail';
}

export function CoverArt({ album, size = 'card' }: Props) {
  const [failed, setFailed] = useState(false);
  const src = coverUrl(album.coverImage);
  const showImg = Boolean(src) && !failed;

  return (
    <div
      className={`cover cover--${size}`}
      style={showImg ? undefined : { background: gradientForId(album.id) }}
    >
      {showImg ? (
        <img
          src={src!}
          alt={`${album.artistEn || album.artistJa}: ${album.titleEn || album.titleJa} cover`}
          loading={size === 'card' ? 'lazy' : 'eager'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="cover__initials"><span>{initials(album)}</span><small>Artwork pending</small></div>
      )}
      <div className="cover__shine" />
    </div>
  );
}
