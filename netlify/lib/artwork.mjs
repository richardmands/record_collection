import { createHash, timingSafeEqual } from 'node:crypto';
import sharp from 'sharp';

export const MAX_FILE = 3 * 1024 * 1024;
const MAX_BODY = MAX_FILE + 16384;
const headers = {'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
class UploadError extends Error {
  constructor(message, status=400) { super(message); this.status=status; }
}
const hash = value => createHash('sha256').update(value).digest();
const json = (data,status=200) => Response.json(data,{status,headers});

export async function normaliseImage(bytes) {
  if (!bytes.length || bytes.length > MAX_FILE) throw new UploadError('Choose an image under 3 MB.',413);
  try {
    const image=sharp(bytes,{limitInputPixels:36000000,failOn:'warning',animated:true});
    const meta=await image.metadata();
    if (!['jpeg','png','webp'].includes(meta.format) || (meta.pages || 1)!==1) throw new UploadError('Use a still JPEG, PNG or WebP image.');
    const {width,height}=meta;
    if (Math.min(width,height)<600 || Math.max(width,height)>6000) throw new UploadError('Each side must be between 600 and 6,000 pixels.');
    if (width/height<0.8 || width/height>1.25) throw new UploadError('Use a near-square front cover; crop away the surrounding background first.');
    // Re-encoding strips EXIF/location metadata and any non-image payload.
    const output=await image.rotate().resize({width:2000,height:2000,fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:90}).toBuffer({resolveWithObject:true});
    if(output.data.length>MAX_FILE) throw new UploadError('This image is too complex to store. Please use a smaller image.',413);
    return output;
  } catch(e) {
    if(e instanceof UploadError) throw e;
    throw new UploadError('This file could not be read as a valid image.');
  }
}

async function limitedBody(request) {
  if(Number(request.headers.get('content-length'))>MAX_BODY) throw new UploadError('Upload is too large. Maximum file size is 3 MB.',413);
  const reader=request.body?.getReader();
  if(!reader) throw new UploadError('Choose a cover image.');
  const chunks=[];let size=0;
  try {
    while(true) {
      const {done,value}=await reader.read();if(done) break;
      size+=value.length;
      if(size>MAX_BODY) {await reader.cancel();throw new UploadError('Upload is too large. Maximum file size is 3 MB.',413);}
      chunks.push(value);
    }
  } finally {reader.releaseLock();}
  return Buffer.concat(chunks);
}

async function reserveUpload(store, now) {
  // Atomic conditional writes prevent simultaneous requests bypassing the cap.
  for(let attempt=0;attempt<5;attempt++) {
    const old=await store.getWithMetadata('upload-rate',{type:'json'});
    const times=(old?.data || []).filter(time=>time>now-3600000);
    if(times.length>=5) throw new UploadError('Five upload attempts per hour are allowed. Please try again later.',429);
    const result=await store.setJSON('upload-rate',[...times,now],old ? {onlyIfMatch:old.etag} : {onlyIfNew:true});
    if(result.modified) return;
  }
  throw new UploadError('Another upload is in progress. Please try again.',409);
}

export function createArtworkHandler({getStore, albums, getSecret=()=>process.env.ARTWORK_ADMIN_KEY, now=()=>Date.now()}) {
  const ids=new Set(albums.map(a=>a.id));
  return async request => {
    try {
      const secret=getSecret();
      if(!secret || secret.length<24) return json({error:'Owner uploads have not been activated yet.'},503);
      const bearer=request.headers.get('authorization') || '';
      if(!bearer.startsWith('Bearer ') || bearer.length>512 || !timingSafeEqual(hash(bearer.slice(7)),hash(secret))) return json({error:'The owner access key is incorrect.'},401);
      const url=new URL(request.url);
      const origin=request.headers.get('origin');
      if(origin && origin!==url.origin) return json({error:'Use the upload page on this website.'},403);
      if(!['GET','POST'].includes(request.method)) return json({error:'Method not allowed.'},405);
      const store=getStore();
      if(request.method==='GET') {
        const id=url.searchParams.get('album');
        if(id) {
          if(!ids.has(id)) return json({error:'Unknown album.'},404);
          const entry=await store.get('pending/'+id,{type:'json'});
          if(!entry) return json({error:'No pending cover for this album.'},404);
          return new Response(Buffer.from(entry.image,'base64'),{headers:{...headers,'Content-Type':'image/jpeg','Content-Disposition':`attachment; filename="${id}_submitted_cover.jpg"`}});
        }
        const entries=await Promise.all(albums.map(async album=>{
          const entry=await store.getMetadata('pending/'+album.id);
          return entry?.metadata || null;
        }));
        return json({submissions:entries.filter(Boolean).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt))});
      }
      if(!request.headers.get('content-type')?.startsWith('multipart/form-data;')) throw new UploadError('Choose a cover image using the upload form.');
      const body=await limitedBody(request);
      let form;
      try {form=await new Response(body,{headers:{'Content-Type':request.headers.get('content-type')}}).formData();}
      catch {throw new UploadError('The upload could not be read. Please select the file again.');}
      const albumId=form.get('albumId');
      if(!ids.has(albumId)) throw new UploadError('Choose an album from the collection.');
      const files=form.getAll('image');
      if(files.length!==1 || !(files[0] instanceof File)) throw new UploadError('Choose exactly one image.');
      if(form.get('confirmed')!=='yes') throw new UploadError('Confirm this image matches the album.');
      const source=form.get('source') || '',notes=form.get('notes') || '';
      if(typeof source!=='string' || source.length>1000 || typeof notes!=='string' || notes.length>500) throw new UploadError('The source or notes are too long.');
      if(source) {
        let parsed;try {parsed=new URL(source);}catch {throw new UploadError('Enter a valid HTTPS source link.');}
        if(parsed.protocol!=='https:' || parsed.username || parsed.password) throw new UploadError('Use an HTTPS source link without sign-in details.');
      } else if(form.get('ownPhoto')!=='yes') throw new UploadError('Add a source link or mark this as your own scan or photo.');
      if(!['image/jpeg','image/png','image/webp'].includes(files[0].type)) throw new UploadError('Use a JPEG, PNG or WebP file.');
      if(files[0].size>MAX_FILE) throw new UploadError('Choose an image under 3 MB.',413);
      await reserveUpload(store,now());
      const output=await normaliseImage(Buffer.from(await files[0].arrayBuffer()));
      const metadata={albumId,source,notes,ownPhoto:form.get('ownPhoto')==='yes',submittedAt:new Date(now()).toISOString(),width:output.info.width,height:output.info.height,bytes:output.data.length};
      // Fixed album keys bound storage to one candidate per existing album.
      await store.setJSON('pending/'+albumId,{...metadata,image:output.data.toString('base64')},{metadata});
      return json({submission:metadata},201);
    } catch(e) {
      if(e instanceof UploadError) return json({error:e.message},e.status);
      return json({error:'The upload service is unavailable. Please try again later.'},503);
    }
  };
}
