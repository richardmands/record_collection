import {useRef,useState} from 'react';
import type {FormEvent} from 'react';
import type {Album} from '../types';
const fields=[['year','Release year'],['catalogNumber','Catalogue number'],['label','Label'],['format','Format'],['country','Country'],['genre','Genre'],['titleEn','Title (English)'],['titleJa','Title (Japanese)'],['artistEn','Artist (English)'],['artistJa','Artist (Japanese)']] as const;
type Submission={albumId:string;changes:Record<string,string>;source:string;notes:string};
export function DetailsSubmission({album}:{album:Album}){
 const [key,setKey]=useState(''),[session,setSession]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [pending,setPending]=useState<Submission|null>(null),[busy,setBusy]=useState(false);const lock=useRef(false);
 async function api(access:string,body?:unknown){
  const response=await fetch('/.netlify/functions/details',{method:body?'POST':'GET',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(30000)});
  const data=await response.json().catch(()=>({error:'The details service is unavailable.'}));
  if(!response.ok){if(response.status===401)setSession('');throw new Error(data.error || 'Please try again.');}return data;
 }
 async function act(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');
  try{
   if(!session){const data=await api(key);setPending(data.submissions.find((s:Submission)=>s.albumId===album.id)||null);setSession(key);setKey('');}
   else{const form=new FormData(event.currentTarget);const changes:Record<string,string>={};for(const [field] of fields){const value=String(form.get(field)||'').trim();if(value && value!==album[field])changes[field]=value;}
    const data=await api(session,{albumId:album.id,changes,source:form.get('source'),notes:form.get('notes')});setPending(data.submission);setMessage('Details saved for review. The catalogue and spreadsheet will update after review and publication.');}
  }catch(e){setError(e instanceof Error?e.message:'Could not save details.');}finally{lock.current=false;setBusy(false);}
 }
 return <details className="artwork-submission"><summary>Add or correct album details · owner only</summary>
  <form className="artwork-form" onSubmit={act}>
   {!session?<><p>Use the same owner access key as cover submissions.</p><label>Owner access key<input type="password" autoComplete="current-password" required maxLength={256} value={key} onChange={e=>setKey(e.target.value)}/></label></>:<>
    <p>{pending?'Your pending changes are shown below. Saving replaces this album’s pending submission.':'Fill in missing information or correct existing details.'} Leave unknown fields blank. Up to 30 submissions per hour.</p>
    {fields.map(([field,label])=><label key={field}>{label}<input name={field} defaultValue={pending?.changes[field]??album[field]} placeholder="Not confirmed" maxLength={field==='year'?4:200} inputMode={field==='year'?'numeric':undefined} pattern={field==='year'?'[0-9]{4}':undefined} disabled={busy}/></label>)}
    <label>Source link (optional)<input name="source" type="url" maxLength={1000} placeholder="https://…" defaultValue={pending?.source} disabled={busy}/></label>
    <label>Where did you find these details?<textarea name="notes" rows={3} maxLength={1000} placeholder="For example: the year printed on the record label. Add a link above or a note here." defaultValue={pending?.notes} disabled={busy}/></label>
   </>}
   <button className="control-button" disabled={busy}>{busy?'Please wait…':session?'Save details for review':'Sign in'}</button>
  </form>
  {session&&<button className="text-button" disabled={busy} onClick={()=>{setSession('');setPending(null);setError('');setMessage('');}}>Sign out</button>}
  {error&&<p role="alert" className="status--error">{error}</p>}{message&&<p role="status">{message}</p>}
 </details>;
}
