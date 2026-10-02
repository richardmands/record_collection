import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
test('Discogs references use known physical-copy IDs and matching public release URLs',()=>{
 const albums=read('public/data/collection.json').albums;
 const matches=read('data/research/discogs-matches.json');
 const enriched=read('data/research/discogs-enrichment.json');
 assert.deepEqual(Object.keys(enriched).sort(),Object.keys(matches).sort());
 for(const [id,release] of Object.entries(enriched)){
  assert.ok(albums.some(a=>a.id===id));assert.equal(release.releaseId,matches[id]);
  assert.equal(release.url,`https://www.discogs.com/release/${matches[id]}`);
  assert.ok(release.tracks.length>0);assert.ok(release.tracks.every(t=>typeof t.title==='string' && t.title.length));
  assert.ok(!('token' in release));assert.ok(!('instanceId' in release));
 }
 for(const [first,second] of [['84','110'],['96','113'],['102','117']]){assert.equal(matches[first],matches[second]);assert.ok(enriched[first] && enriched[second]);}
});
