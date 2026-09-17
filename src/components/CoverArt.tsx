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
      aria-hidden={!showImg}
    >
      {showImg ? (
        <img
          src={src!}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="cover__initials">{initials(album)}</span>
      )}
      <div className="cover__shine" />
    </div>
  );
}
