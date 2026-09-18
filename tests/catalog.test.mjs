import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readSheet } from 'read-excel-file/node';
import { buildCollection, rowsToObjects, toCsv } from '../scripts/catalog.mjs';
import { matchesSearch, sortAlbums, displayText } from '../src/utils.ts';
const root=process.cwd();
const albums=rowsToObjects(await readSheet('data/record_collection.xlsx','Albums'),'Albums');
const tracks=rowsToObjects(await readSheet('data/record_collection.xlsx','Tracks'),'Tracks');
const collection=buildCollection(albums,tracks,root);
const clone=()=>structuredClone(albums);
test('workbook preserves all records, uses distinct sheets, and matches published JSON',()=>{
 assert.ok(collection.albumCount>=142);assert.ok(tracks.length>=448);
 assert.deepEqual(collection,JSON.parse(fs.readFileSync('public/data/collection.json','utf8')));
 assert.equal(collection.albums.find(a=>a.id==='36').artistEn,'Hibari Misora');
 assert.equal(collection.albums.find(a=>a.id==='36').tracks.length,0);
 assert.equal(collection.albums.find(a=>a.id==='35').tracks.length,12);
 assert.equal(collection.albums.find(a=>a.id==='26').tracks.length,14);
 assert.equal(collection.albums.find(a=>a.id==='39').tracks.length,28);
});
test('rejects duplicate record IDs',()=>assert.throws(()=>buildCollection([...albums,albums[0]],tracks,root),/Duplicate collection ID/));
test('rejects duplicate track positions and orphan tracks',()=>{
 assert.throws(()=>buildCollection(albums,[...tracks,tracks[0]],root),/duplicate track/);
 assert.throws(()=>buildCollection(albums,[{...tracks[0],'Collection ID':'999999'}],root),/unknown record/);
});
test('rejects unrecognised sources, unsafe paths and nonexistent artwork',()=>{
 let a=clone();a[0]['Cover Status']='unattributed';assert.throws(()=>buildCollection(a,tracks,root),/recognised status and source/);
 a=clone();a[0]['Cover Image Filename']='../reference-photos/IMG_3229.jpg';assert.throws(()=>buildCollection(a,tracks,root),/unsafe cover/);
 a=clone();a[0]['Cover Image Filename']='missing.jpg';assert.throws(()=>buildCollection(a,tracks,root),/missing cover/);
});
test('requires source attribution and explicit verification issues',()=>{
 let a=clone();a[0]['Cover Source']='';assert.throws(()=>buildCollection(a,tracks,root),/recognised status and source/);
 a=clone();a[0]['Verification Issues']='';assert.throws(()=>buildCollection(a,tracks,root),/explain what/);
});
test('reference covers retain original photos and album information has safe, labelled sources',()=>{
 assert.equal(collection.albums.filter(a=>a.coverImage).length,collection.albumCount);
 for(const id of ['03','06','13','24','34','37','39','40'])assert.equal(collection.albums.find(a=>a.id===id).coverStatus,'reference_photo');
 assert.ok(collection.albums.every(a=>a.summary && a.summarySource && a.summarySourceLabel));
 let a=clone();a.find(a=>a['Cover Status']==='reference_photo')['Source Photo']='missing.jpg';
 assert.throws(()=>buildCollection(a,tracks,root),/original source photo/);
 a=clone();a[0]['Summary Source']='';assert.throws(()=>buildCollection(a,tracks,root),/summary requires/);
 a=clone();a[0]['Artist Info URL']='javascript:alert(1)';assert.throws(()=>buildCollection(a,tracks,root),/HTTPS/);
 a=clone();a[0]['Artist Info Label']='';assert.throws(()=>buildCollection(a,tracks,root),/labelled link/);
});
test('September batch preserves all physical copies and their separate photographs',()=>{
 const batch=JSON.parse(fs.readFileSync('data/research/photo-audit-2026-09-18.json','utf8'));
 assert.equal(batch.records.length,101);
 for(const r of batch.records){
  const a=albums.find(a=>a['Collection ID']===r.id);
  assert.ok(a);assert.equal(a['Source Photo'],r.sourcePhoto);
 }
 for(const [first,second] of batch.duplicateCopiesConfirmedByOwner){
  const pair=[first,second].map(id=>albums.find(a=>a['Collection ID']===id));
  assert.equal(pair[0]['Title (English)'],pair[1]['Title (English)']);
  assert.notEqual(pair[0]['Source Photo'],pair[1]['Source Photo']);
 }
});
test('rejects malformed headings and retains zero-padded IDs',()=>{
 assert.throws(()=>rowsToObjects([['A','A'],['1','2']],'test'),/duplicate column/);
 assert.equal(collection.albums[0].id,'01');
});
test('CSV correctly escapes commas, newlines and quotes',()=>assert.equal(toCsv([['one,two','a"b','line\nline',null]]),'"one,two","a""b","line\nline",\n'));
test('multiword search crosses artist, catalogue and track fields',()=>{
 const a=collection.albums.find(a=>a.id==='01');
 assert.equal(matchesSearch(a,'harumi meigetsu'),true);
 assert.equal(matchesSearch(a,'HARUMI ＡＬＳ 4183'),true);
 assert.equal(matchesSearch(a,'harumi definitelymissing'),false);
 const b=collection.albums.find(a=>a.id==='41');assert.equal(matchesSearch(b,'ijuro urashima'),true);
 assert.equal(matchesSearch(b,'浦島'),true);
});
test('sort leaves original ordering intact and handles unknown years',()=>{
 const ids=collection.albums.map(a=>a.id);const sorted=sortAlbums(collection.albums,'year');
 assert.deepEqual(collection.albums.map(a=>a.id),ids);assert.equal(sorted.at(-1).year,'');
});
test('language preference falls back when a translation is missing',()=>{
 assert.deepEqual(displayText('Hello','こんにちは','ja'),['こんにちは','Hello']);
 assert.deepEqual(displayText('','こんにちは','en'),['こんにちは','']);
});
test('both artist sorts put each artist’s albums in year order, with unknown years last',()=>{
 for (const key of ['artistEn','artistJa']) {
  const sorted=sortAlbums(collection.albums,key);
  assert.deepEqual(sorted.filter(a=>a.artistEn==='Harumi Miyako').map(a=>a.id),['01','08','07','33','06','24']);
  assert.deepEqual(sorted.filter(a=>a.artistEn==='Ayumi Ishida').map(a=>a.id),['28','23']);
 }
});
