import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createArtworkHandler,normaliseImage,MAX_FILE} from '../netlify/lib/artwork.mjs';
const key='test-only-access-key-not-for-production';
const origin='https://records.example';
const image=await sharp({create:{width:800,height:800,channels:3,background:'#c08050'}}).png().toBuffer();
function setup(secret=key){
 const entries=new Map();let revision=0;
 const store={
  async getWithMetadata(k){return structuredClone(entries.get(k) || null);},
  async get(k){return structuredClone(entries.get(k)?.data || null);},
  async getMetadata(k){const e=entries.get(k);return e?{metadata:e.metadata}:null;},
  async setJSON(k,data,options={}){
   const existing=entries.get(k);
   if(options.onlyIfNew && existing || options.onlyIfMatch && options.onlyIfMatch!==existing?.etag)return {modified:false};
   entries.set(k,{data:structuredClone(data),metadata:options.metadata,etag:String(++revision)});return {modified:true};
  },
 };
 let clock=100000000;
 return {entries,advance:()=>clock+=3600001,handler:createArtworkHandler({getStore:()=>store,albums:[{id:'01'},{id:'02'}],getSecret:()=>secret,now:()=>clock})};
}
function request({auth=key,bytes=image,albumId='01',type='image/png',source='https://example.com/cover',confirmed='yes',method='POST',path='',requestOrigin=origin}={}){
 const headers={Authorization:'Bearer '+auth,Origin:requestOrigin};
 let body;
 if(method==='POST') {body=new FormData();body.set('albumId',albumId);body.set('image',new File([bytes],'cover.png',{type}));body.set('source',source);body.set('confirmed',confirmed);}
 return new Request(origin+'/.netlify/functions/artwork'+path,{method,headers,body});
}
test('uploads fail closed without configuration and require auth for writes, listing and downloads',async()=>{
 assert.equal((await setup('').handler(request())).status,503);
 const {handler,entries}=setup();
 for(const method of ['GET','POST']) assert.equal((await handler(request({auth:'wrong',method}))).status,401);
 assert.equal((await handler(request({auth:'wrong',method:'GET',path:'?album=01'}))).status,401);
 assert.equal(entries.size,0);
 assert.equal((await handler(request({requestOrigin:'https://attacker.example'}))).status,403);
});
test('valid covers are sanitised and stored privately with attribution; replacement stays bounded',async()=>{
 const {handler,entries}=setup();
 assert.equal((await handler(request())).status,201);
 let response=await handler(request({method:'GET'}));
 assert.equal(response.headers.get('cache-control'),'private, no-store');
 const list=await response.json();assert.equal(list.submissions.length,1);assert.equal(list.submissions[0].source,'https://example.com/cover');assert.equal(list.submissions[0].image,undefined);
 response=await handler(request({method:'GET',path:'?album=01'}));assert.equal(response.headers.get('content-type'),'image/jpeg');
 const metadata=await sharp(Buffer.from(await response.arrayBuffer())).metadata();assert.equal(metadata.format,'jpeg');assert.equal(metadata.width,800);assert.equal(metadata.exif,undefined);
 assert.equal((await handler(request())).status,201);assert.equal([...entries.keys()].filter(k=>k.startsWith('pending/')).length,1);
});
test('rejects invalid files, oversized bodies, unknown albums and missing provenance',async()=>{
 const {handler}=setup();
 assert.equal((await handler(request({albumId:'../other'}))).status,400);
 assert.equal((await handler(request({source:'javascript:alert(1)'}))).status,400);
 assert.equal((await handler(request({source:''}))).status,400);
 assert.equal((await handler(request({confirmed:''}))).status,400);
 assert.equal((await handler(request({type:'image/svg+xml'}))).status,400);
 assert.equal((await handler(request({bytes:Buffer.from('not an image')}))).status,400);
 const oversized=request({bytes:Buffer.alloc(MAX_FILE+20000)});
 // An inbound HTTP body is already encoded; avoid cancelling Node's FormData encoder.
 assert.equal((await handler(new Request(oversized.url,{method:'POST',headers:oversized.headers,body:await oversized.arrayBuffer()}))).status,413);
});
test('pixel bounds, aspect ratio and actual format are checked, not just the filename',async()=>{
 const small=await sharp({create:{width:599,height:600,channels:3,background:'red'}}).png().toBuffer();
 await assert.rejects(normaliseImage(small),/600/);
 const wide=await sharp({create:{width:1500,height:600,channels:3,background:'red'}}).png().toBuffer();
 await assert.rejects(normaliseImage(wide),/near-square/);
 await assert.rejects(normaliseImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"></svg>')),/JPEG|valid image/);
});
test('atomic rate cap holds across concurrent requests and resets after an hour',async()=>{
 const {handler,advance}=setup();
 const responses=await Promise.all(Array.from({length:7},()=>handler(request())));
 assert.equal(responses.filter(r=>r.status===201).length,5);
 assert.ok(responses.filter(r=>r.status!==201).every(r=>[429,409].includes(r.status)));
 assert.equal((await handler(request())).status,429);
 advance();assert.equal((await handler(request())).status,201);
});
