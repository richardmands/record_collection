#!/usr/bin/env node
/**
 * Rebuild public/data/collection.json from data/*.csv
 *
 * Expects:
 *   data/record_collection.csv
 *   data/record_collection_tracks.csv
 *
 * Cover images should already live in public/covers/ with filenames matching
 * the "Cover Image Filename" column.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const albumsCsv = path.join(root, 'data', 'record_collection.csv');
const tracksCsv = path.join(root, 'data', 'record_collection_tracks.csv');
const outJson = path.join(root, 'public', 'data', 'collection.json');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (c === '\r') {
      // skip
    } else {
      cell += c;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => String(x).trim() !== ''));
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (r[i] ?? '').trim();
    });
    return obj;
  });
}

if (!fs.existsSync(albumsCsv) || !fs.existsSync(tracksCsv)) {
  console.error('Missing CSV files in data/. Need record_collection.csv and record_collection_tracks.csv');
  process.exit(1);
}

const albumRows = rowsToObjects(parseCsv(fs.readFileSync(albumsCsv, 'utf8')));
const trackRows = rowsToObjects(parseCsv(fs.readFileSync(tracksCsv, 'utf8')));

const tracksById = new Map();
for (const t of trackRows) {
  const id = t['Collection ID'];
  if (!id) continue;
  if (!tracksById.has(id)) tracksById.set(id, []);
  tracksById.get(id).push({
    side: t['Side'] || '',
    number: t['Track Number'] || '',
    titleJa: t['Title (Japanese)'] || '',
    titleEn: t['Title (English/Romanization)'] || '',
    duration: t['Duration'] || '',
  });
}

const albums = albumRows.map((r) => {
  const id = r['Collection ID'];
  return {
    id,
    artistJa: r['Artist (Japanese)'] || '',
    artistEn: r['Artist (English)'] || '',
    titleJa: r['Title (Japanese)'] || '',
    titleEn: r['Title (English)'] || '',
    label: r['Label'] || '',
    catalogNumber: r['Catalog Number'] || '',
    year: r['Year'] || '',
    format: r['Format'] || '',
    country: r['Country'] || '',
    genre: r['Genre'] || '',
    retailPriceJpy: r['Retail Price (JPY)'] || '',
    notes: r['Notes'] || '',
    coverImage: r['Cover Image Filename'] || '',
    discogsUrl: r['Discogs URL'] || '',
    tracks: tracksById.get(id) || [],
  };
});

const collection = {
  version: 1,
  albumCount: albums.length,
  albums,
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(collection, null, 2) + '\n');
console.log(`Wrote ${albums.length} albums → ${path.relative(root, outJson)}`);
