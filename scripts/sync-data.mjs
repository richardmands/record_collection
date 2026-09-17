#!/usr/bin/env node
// The workbook is authoritative. CSV and browser JSON are generated together.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSheet } from 'read-excel-file/node';
import { rowsToObjects, toCsv, buildCollection } from './catalog.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workbook = path.join(root,'data','record_collection.xlsx');
const albumData = await readSheet(workbook,'Albums');
const trackData = await readSheet(workbook,'Tracks');
const collection = buildCollection(rowsToObjects(albumData,'Albums'),rowsToObjects(trackData,'Tracks'),root);
const outputs = [
  ['data/record_collection.csv',toCsv(albumData)],
  ['data/record_collection_tracks.csv',toCsv(trackData)],
  ['public/data/collection.json',JSON.stringify(collection,null,2)+'\n'],
];
for (const [filename,content] of outputs) {
  const target=path.join(root,filename);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(target) || fs.readFileSync(target,'utf8').replaceAll('\r\n','\n') !== content) throw new Error(`${filename} is stale. Run npm run sync-data.`);
  } else {
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.writeFileSync(target,content);
  }
}
console.log(`Validated ${collection.albumCount} albums and ${trackData.length-1} tracks; ${collection.albums.filter(a=>!a.coverImage).length} artwork matches pending.`);
