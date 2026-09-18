import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Album } from '../types';

type Submission={albumId:string;source:string;notes:string;submittedAt:string;width:number;height:number;bytes:number};
const endpoint='/.netlify/functions/artwork';

export function ArtworkSubmission({album}:{album:Album}) {
  const [key,setKey]=useState('');
  const [session,setSession]=useState('');
  const [pending,setPending]=useState<Submission[]>([]);
  const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [ownPhoto,setOwnPhoto]=useState(false);
  const inFlight=useRef(false);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  async function api(accessKey:string, options:RequestInit={}) {
    const response=await fetch(endpoint,{...options,headers:{Authorization:`Bearer ${accessKey}`},cache:'no-store',signal:AbortSignal.timeout(30000)});
    const data=await response.json().catch(()=>({error:'The upload service is unavailable. Please try again later.'}));
    if(!response.ok) {if(response.status===401)setSession('');throw new Error(data.error || 'Please try again later.');}
    return data;
  }
  async function login(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');
    try {const data=await api(key);setPending(data.submissions);setSession(key);setKey('');}
    catch(e){setError(e instanceof Error?e.message:'Could not sign in.');}
    finally{inFlight.current=false;setBusy(false);}
  }
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(inFlight.current)return;
    setError('');setMessage('');
    if(!file){setError('Choose an image first.');return;}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>3*1024*1024){setError('Choose a JPEG, PNG or WebP image under 3 MB.');return;}
    const form=event.currentTarget;
    const body=new FormData(form);body.set('albumId',album.id);body.set('image',file);
    inFlight.current=true;setBusy(true);
    try {
      const data=await api(session,{method:'POST',body});
      setPending(previous=>[data.submission,...previous.filter(p=>p.albumId!==album.id)]);
      setMessage('Cover saved for review. The published artwork has not changed.');setFile(null);setPreview('');setOwnPhoto(false);form.reset();
    } catch(e){setError(e instanceof Error?e.message:'Upload failed. Please try again.');}
    finally{inFlight.current=false;setBusy(false);}
  }
  async function download() {
    setBusy(true);setError('');
    try {
      const response=await fetch(`${endpoint}?album=${encodeURIComponent(album.id)}`,{headers:{Authorization:`Bearer ${session}`},cache:'no-store',signal:AbortSignal.timeout(30000)});
      if(!response.ok)throw new Error('Could not download the pending cover. Please sign in again.');
      const url=URL.createObjectURL(await response.blob());const a=document.createElement('a');a.href=url;a.download=`${album.id}_submitted_cover.jpg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
    } catch(e){setError(e instanceof Error?e.message:'Download failed.');}
    finally{setBusy(false);}
  }
  const candidate=pending.find(p=>p.albumId===album.id);
  return <details className="artwork-submission"><summary>Submit a better cover · owner only</summary>
    {!session ? <form onSubmit={login} className="artwork-form">
      <p>Sign in with your artwork access key. Submissions stay private until reviewed.</p>
      <label>Owner access key<input type="password" autoComplete="current-password" value={key} onChange={e=>setKey(e.target.value)} required maxLength={256}/></label>
      <button className="control-button" disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
    </form> : <>
      <div className="detail-links"><span>Signed in for this album</span><button className="text-button" disabled={busy} onClick={()=>{setSession('');setPending([]);setFile(null);setPreview('');setMessage('');setError('');}}>Sign out</button></div>
      {candidate && <div className="verification"><h3>A cover is waiting for review</h3><p>{candidate.width} × {candidate.height} pixels · submitted {new Date(candidate.submittedAt).toLocaleDateString('en-GB')}</p><button className="text-button" disabled={busy} onClick={download}>Download pending cover</button></div>}
      <form className="artwork-form" onSubmit={submit}>
        <p>One front-cover image: JPEG, PNG or WebP, up to 3 MB. Each side must be 600–6,000 pixels and the image should be near-square. Up to five upload attempts per hour.</p>
        <label>Cover image<input type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} onChange={e=>{const chosen=e.target.files?.[0] || null;setFile(chosen);setPreview(chosen && chosen.size<=3*1024*1024 && ['image/jpeg','image/png','image/webp'].includes(chosen.type)?URL.createObjectURL(chosen):'');setError('');setMessage('');}}/></label>
        {preview && <img className="submission-preview" src={preview} alt="Proposed cover preview"/>}
        <label>Image source link{ownPhoto?' (optional)':''}<input name="source" type="url" placeholder="https://…" maxLength={1000} required={!ownPhoto} disabled={busy}/></label>
        <label className="check-label"><input name="ownPhoto" type="checkbox" value="yes" checked={ownPhoto} onChange={e=>setOwnPhoto(e.target.checked)} disabled={busy}/>This is my own scan or photo</label>
        <label>Notes (optional)<textarea name="notes" maxLength={500} rows={3} disabled={busy}/></label>
        <label className="check-label"><input name="confirmed" type="checkbox" value="yes" required disabled={busy}/>I’ve checked that this is the correct front cover for this album.</label>
        <p>Location metadata is removed and large images are reduced to 2,000 pixels. {candidate?'Submitting replaces the pending candidate, not the published cover.':'The current cover stays in place until this image is reviewed.'}</p>
        <button className="control-button" disabled={busy}>{busy?'Uploading…':candidate?'Replace pending cover':'Submit for review'}</button>
      </form>
    </>}
    {error && <p role="alert" className="status--error">{error}</p>}
    {message && <p role="status">{message}</p>}
  </details>;
}
