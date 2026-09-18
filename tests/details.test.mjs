import test from 'node:test';
import assert from 'node:assert/strict';
import {createDetailsHandler} from '../netlify/lib/details.mjs';
const key='test-owner-key-with-at-least-24-characters';
function setup(secret=key){
 const entries=new Map();let revision=0;
 const store={async get(k){return entries.get(k)?.data??null;},async getWithMetadata(k){return entries.get(k)??null;},async setJSON(k,data,options={}){const old=entries.get(k);if(options.onlyIfNew&&old || options.onlyIfMatch&&options.onlyIfMatch!==old?.etag)return {modified:false};entries.set(k,{data,etag:String(++revision)});return {modified:true};}};
 return {entries,handler:createDetailsHandler({getStore:()=>store,albums:[{id:'01',year:'',label:'Victor'}],getSecret:()=>secret,now:()=>Date.UTC(2026,8,18)})};
}
function request(body={albumId:'01',changes:{year:'1975'},notes:'Printed on label'},auth=key,method='POST'){
 return new Request('https://example.com/.netlify/functions/details',{method,headers:{Authorization:'Bearer '+auth,'Content-Type':'application/json'},body:method==='POST'?JSON.stringify(body):undefined});
}
test('details require configured owner auth for reading and writing',async()=>{
 assert.equal((await setup('').handler(request())).status,503);
 assert.equal((await setup('short').handler(request())).status,503);
 for(const method of ['GET','POST'])assert.equal((await setup().handler(request(undefined,'wrong',method))).status,401);
 const r=request();r.headers.set('origin','https://other.example');assert.equal((await setup().handler(r)).status,403);
});
test('missing year stored with original value; pending replacement and private retrieval',async()=>{
 const {handler,entries}=setup();assert.equal((await handler(request())).status,201);
 assert.equal((await handler(request({albumId:'01',changes:{year:'1976',label:'RCA'},source:'https://example.com/release'}))).status,201);
 const result=await handler(request(undefined,key,'GET'));assert.equal(result.headers.get('cache-control'),'private, no-store');
 const {submissions}=await result.json();assert.equal(submissions.length,1);assert.deepEqual(submissions[0].previous,{year:'',label:'Victor'});assert.equal(submissions[0].changes.year,'1976');assert.equal(entries.size,2);
});
test('reject invalid years, unknown albums/fields, empty changes and unsafe sources',async()=>{
 for(const changes of [{year:'unknown'},{year:'1850'},{year:'2028'},{label:'Victor'},{year:''},{coverImage:'bad'},{}])assert.equal((await setup().handler(request({albumId:'01',changes,notes:'label'}))).status,400);
 for(const body of [{albumId:'99',changes:{year:'1975'},notes:'label'},{albumId:'01',changes:{year:'1975'}},{albumId:'01',changes:{year:'1975'},source:'javascript:alert(1)'},null])assert.equal((await setup().handler(request(body))).status,400);
 assert.equal((await setup().handler(request({notes:'x'.repeat(17000)}))).status,413);
});
test('saved submission limit enforced',async()=>{
 const {handler}=setup();for(let i=0;i<30;i++)assert.equal((await handler(request())).status,201);assert.equal((await handler(request())).status,429);
});
