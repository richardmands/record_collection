import {createHash, timingSafeEqual} from 'node:crypto';
const fields=['year','catalogNumber','label','format','country','genre','titleEn','titleJa','artistEn','artistJa'];
const hash=s=>createHash('sha256').update(s).digest();
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export function createDetailsHandler({albums,getStore,getSecret=()=>process.env.ARTWORK_ADMIN_KEY,now=()=>Date.now()}) {
 return async request=>{
  try {
   const secret=getSecret();
   if(!secret || secret.length<24)return reply({error:'Set ARTWORK_ADMIN_KEY to a random value of at least 24 characters in Netlify Functions, then redeploy.'},503);
   const auth=request.headers.get('authorization') || '';
   if(!auth.startsWith('Bearer ') || auth.length>512 || !timingSafeEqual(hash(auth.slice(7)),hash(secret)))return reply({error:'The owner access key is incorrect.'},401);
   if(request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Use the form on this website.'},403);
   if(!['GET','POST'].includes(request.method))return reply({error:'Method not allowed.'},405);
   const store=getStore();
   if(request.method==='GET')return reply({submissions:(await Promise.all(albums.map(a=>store.get('pending/'+a.id,{type:'json'})))).filter(Boolean)});
   if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'Use JSON.'},400);
   const reader=request.body?.getReader();if(!reader)return reply({error:'Missing details.'},400);
   let size=0;const chunks=[];
   try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();return reply({error:'Details exceed 16 KB.'},413);}chunks.push(value);}}finally{reader.releaseLock();}
   let body;try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{return reply({error:'Invalid JSON.'},400);}
   const album=albums.find(a=>a.id===body?.albumId);
   if(!album || !body.changes || typeof body.changes!=='object' || Array.isArray(body.changes))return reply({error:'Choose an album and enter changes.'},400);
   const changes={},previous={};
   for(const [field,value] of Object.entries(body.changes)){
    if(!fields.includes(field) || typeof value!=='string' || !value.trim() || value.length>200)return reply({error:'Invalid field or value (maximum 200 characters).'},400);
    const clean=value.trim();
    if(field==='year' && (!/^\d{4}$/.test(clean) || Number(clean)<1877 || Number(clean)>new Date(now()).getUTCFullYear()+1))return reply({error:'Enter a four-digit release year between 1877 and next year.'},400);
    if(clean!==String(album[field] || '')){changes[field]=clean;previous[field]=album[field] || '';}
   }
   if(!Object.keys(changes).length)return reply({error:'Enter at least one new or corrected detail.'},400);
   const {source='',notes=''}=body;
   if(typeof source!=='string' || source.length>1000 || typeof notes!=='string' || notes.length>1000)return reply({error:'Source and notes must each be under 1,000 characters.'},400);
   if(source){let u;try{u=new URL(source);}catch{return reply({error:'Enter a valid HTTPS source.'},400);}if(u.protocol!=='https:' || u.username || u.password)return reply({error:'Use an HTTPS source without login details.'},400);}
   if(!source && !notes.trim())return reply({error:'Add a source link or explain where you found the details, such as the record label.'},400);
   let reserved=false;
   for(let attempt=0;attempt<5;attempt++){
    const old=await store.getWithMetadata('rate',{type:'json'});const times=(old?.data || []).filter(t=>t>now()-3600000);
    if(times.length>=30)return reply({error:'Up to 30 submissions per hour. Please try later.'},429);
    if((await store.setJSON('rate',[...times,now()],old?{onlyIfMatch:old.etag}:{onlyIfNew:true})).modified){reserved=true;break;}
   }
   if(!reserved)return reply({error:'Another submission is in progress. Please retry.'},409);
   const submission={albumId:album.id,changes,previous,source,notes,submittedAt:new Date(now()).toISOString()};
   await store.setJSON('pending/'+album.id,submission);
   return reply({submission},201);
  }catch{return reply({error:'The details service is unavailable. Please try later.'},503);}
 };
}
