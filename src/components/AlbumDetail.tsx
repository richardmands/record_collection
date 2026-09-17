import { useEffect, useRef, useState } from 'react';
import type { Album, Language } from '../types';
import { CoverArt } from './CoverArt';
import { coverUrl, displayText } from '../utils';

export function AlbumDetail({ album, language, onClose, onPrevious, onNext, onArtistSelect }: {
  album: Album; language: Language; onClose: () => void; onPrevious?: () => void; onNext?: () => void; onArtistSelect: (album: Album) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [title, subtitle] = displayText(album.titleEn, album.titleJa, language);
  const [artist, otherArtist] = displayText(album.artistEn, album.artistJa, language);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  const sideNames = [...new Set(album.tracks.map(t => t.side || '?'))];
  const facts = [
    ['Catalogue number', album.catalogNumber], ['Release year', album.year],
    ['Label', album.label], ['Format', album.format], ['Country', album.country],
    ['Genre', album.genre], ['Original retail price', album.retailPriceJpy],
  ];
  const copyFacts = [
    ['Shelf location', album.shelfLocation], ['Vinyl condition', album.vinylCondition],
    ['Sleeve condition', album.sleeveCondition], ['Obi', album.obi], ['Inserts', album.inserts],
    ['Purchase date', album.purchaseDate], ['Price paid', album.pricePaid ? [album.purchaseCurrency, album.pricePaid].filter(Boolean).join(' ') : ''],
  ];
  async function copyLink() {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setCopyError(false); }
    catch { setCopied(false); setCopyError(true); }
  }
  return <dialog ref={dialog} className="record-dialog" aria-labelledby="detail-title"
    onCancel={e => { e.preventDefault(); if (zoom) setZoom(false); else onClose(); }}
    onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <nav className="detail-nav" aria-label="Record navigation">
      <button autoFocus onClick={() => zoom ? setZoom(false) : onClose()}>{zoom ? '← Album details' : '← Collection'}</button>
      <div><button disabled={!onPrevious} onClick={onPrevious} aria-label="Previous album">← Previous</button>
      <button disabled={!onNext} onClick={onNext} aria-label="Next album">Next →</button></div>
    </nav>
    {zoom ? <section className="artwork-view">
      <h2 id="detail-title">{title}</h2>
      <img src={coverUrl(album.coverImage)!} alt={`${artist} — ${title} cover artwork`} />
      <p>{album.coverStatus === 'reference_photo' ? 'Cropped and straightened from your reference photo.' : 'Source image at its available resolution.'}</p>
      {album.coverSource && <a href={album.coverSource} target="_blank" rel="noreferrer">Artwork source ↗</a>}
    </section> : <div className="detail-content">
      <div className="detail-hero">
        <div>{album.coverImage ? <button className="cover-enlarge" onClick={() => setZoom(true)} aria-label="Enlarge cover artwork">
          <CoverArt album={album} size="detail" /><span>Enlarge artwork ↗</span>
        </button> : <CoverArt album={album} size="detail" />}
        {album.coverSource && <a className="source-link" href={album.coverSource} target="_blank" rel="noreferrer">{album.coverStatus === 'reference_photo' ? 'Your reference photo' : 'Artwork source'} ↗</a>}
        </div>
        <div className="detail-hero__text">
          <p className="detail-kicker">Record #{album.id}</p>
          <h2 id="detail-title" className="detail-title">{title}</h2>
          {subtitle && <p className="detail-title-ja" lang={language === 'en' ? 'ja' : 'en'}>{subtitle}</p>}
          <p className="detail-artist"><button className="artist-link" onClick={() => onArtistSelect(album)} aria-label={`View all albums by ${artist}`}>{artist}{otherArtist && <span className="detail-artist-ja"> / {otherArtist}</span>}</button></p>
          {album.artistInfoUrl && <a className="source-link" href={album.artistInfoUrl} target="_blank" rel="noreferrer">Artist information · {album.artistInfoLabel} ↗</a>}
          <dl className="detail-facts">{facts.map(([name,value]) => <div key={name}><dt>{name}</dt><dd>{value || 'Not confirmed'}</dd></div>)}</dl>
          <div className="detail-links">
            {album.discogsUrl && <a href={album.discogsUrl} target="_blank" rel="noreferrer">{album.discogsUrl.includes('/release/') ? 'View release on Discogs' : 'Search Discogs'} ↗</a>}
            <button className="text-button" onClick={copyLink}>Copy album link</button><span role="status">{copied ? 'Link copied' : copyError ? 'Copy the address from your browser to share this record.' : ''}</span>
          </div>
        </div>
      </div>
      {album.summary && <section className="detail-notes"><h3>About this album</h3><p>{album.summary}</p><a className="source-link" href={album.summarySource} target="_blank" rel="noreferrer">{album.summarySourceLabel} ↗</a></section>}
      {album.verificationIssues.length > 0 && <section className="verification"><h3>Needs verification</h3>
        <ul>{album.verificationIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>
      </section>}
      {album.notes && <section className="detail-notes"><h3>Sleeve notes</h3><p>{album.notes}</p></section>}
      <section className="detail-notes"><h3>My copy</h3><dl className="detail-facts">{copyFacts.map(([name,value]) => <div key={name}><dt>{name}</dt><dd>{value || 'Not recorded'}</dd></div>)}</dl></section>
      {album.researchNotes && <details className="research-notes"><summary>Identification and research notes</summary><p>{album.researchNotes}</p></details>}
      <section className="detail-tracks"><h3>Track listing</h3>
        {!sideNames.length && <p className="muted">Track listing not yet recorded.</p>}
        <div className="sides-grid">{sideNames.map(side => <div className="side-block" key={side}><h4 className="side-label">Side {side}</h4>
          <ol className="track-list">{album.tracks.filter(t => (t.side || '?') === side).sort((a,b) => Number(a.number)-Number(b.number)).map(t => {
            const [name,other] = displayText(t.titleEn,t.titleJa,language);
            return <li key={t.number}><span className="track-num">{t.number}</span><span className="track-titles"><span>{name}</span>{other && <span className="track-ja">{other}</span>}</span>{t.duration && <span className="track-dur">{t.duration}</span>}</li>;
          })}</ol>
        </div>)}</div>
      </section>
    </div>}
  </dialog>;
}
