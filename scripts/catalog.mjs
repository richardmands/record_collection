import fs from 'node:fs';
import path from 'node:path';

export function rowsToObjects(rows, name) {
  if (!rows.length) throw new Error(`${name}: empty worksheet`);
  const headers = rows[0].map(v => String(v ?? '').trim());
  if (headers.some(h => !h) || new Set(headers).size !== headers.length) throw new Error(`${name}: blank or duplicate column headings`);
  return rows.slice(1).filter(row => row.some(v => v !== null && v !== '')).map(row => Object.fromEntries(headers.map((h,i) =>
    [h, row[i] instanceof Date ? row[i].toISOString().slice(0,10) : String(row[i] ?? '').trim()])));
}
export function toCsv(rows) {
  return rows.map(row => row.map(value => {
    const s = value instanceof Date ? value.toISOString().slice(0,10) : String(value ?? '');
    return /[",\r\n]/.test(s) ? '"' + s.replaceAll('"','""') + '"' : s;
  }).join(',')).join('\n') + '\n';
}
const columns = {
  id:'Collection ID', artistJa:'Artist (Japanese)', artistEn:'Artist (English)',
  titleJa:'Title (Japanese)', titleEn:'Title (English)', label:'Label',
  catalogNumber:'Catalog Number', year:'Year', format:'Format', country:'Country', genre:'Genre',
  retailPriceJpy:'Retail Price (JPY)', notes:'Notes', researchNotes:'Research Notes',
  summary:'Album Summary', summarySource:'Summary Source', summarySourceLabel:'Summary Source Label',
  artistInfoUrl:'Artist Info URL', artistInfoLabel:'Artist Info Label',
  coverImage:'Cover Image Filename', coverSource:'Cover Source', coverStatus:'Cover Status',
  discogsUrl:'Discogs URL', verificationStatus:'Verification Status',
  shelfLocation:'Shelf Location', vinylCondition:'Vinyl Condition', sleeveCondition:'Sleeve Condition',
  obi:'Obi', inserts:'Inserts', purchaseDate:'Purchase Date', pricePaid:'Price Paid', purchaseCurrency:'Purchase Currency',
};
export function buildCollection(albumRows, trackRows, root) {
  const albums = albumRows.map(row => {
    const a = Object.fromEntries(Object.entries(columns).map(([key,column]) => [key, row[column] || '']));
    a.verificationIssues = (row['Verification Issues'] || '').split('|').map(s => s.trim()).filter(Boolean);
    a.tracks = [];
    return a;
  });
  const ids = new Set();
  for (const a of albums) {
    if (!/^\d{2,}$/.test(a.id)) throw new Error(`Invalid collection ID: ${a.id}. Keep IDs as text, e.g. 01.`);
    if (ids.has(a.id)) throw new Error(`Duplicate collection ID: ${a.id}`);
    ids.add(a.id);
    if (!(a.titleEn || a.titleJa) || !(a.artistEn || a.artistJa)) throw new Error(`Record ${a.id}: title and artist required`);
    for (const key of ['discogsUrl','coverSource','summarySource','artistInfoUrl']) if (a[key]) {
      const url = new URL(a[key]);
      if (url.protocol !== 'https:') throw new Error(`Record ${a.id}: ${key} must be HTTPS`);
    }
    if (a.coverImage) {
      if (!/^[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp)$/.test(a.coverImage)) throw new Error(`Record ${a.id}: unsafe cover filename`);
      if (!fs.existsSync(path.join(root,'public','covers',a.coverImage))) throw new Error(`Record ${a.id}: missing cover ${a.coverImage}`);
      if (!a.coverSource || !['discogs','retailer','official','reference_photo'].includes(a.coverStatus)) throw new Error(`Record ${a.id}: artwork requires a recognised status and source`);
      if (a.coverStatus === 'reference_photo') {
        const photo = albumRows.find(row => row['Collection ID'] === a.id)['Source Photo']?.match(/^IMG_\d+\.jpg\b/)?.[0];
        if (!/^IMG_\d+\.jpg$/.test(photo || '') || !fs.existsSync(path.join(root,'data','reference-photos',photo)) || a.coverSource !== `https://github.com/richardmands/record_collection/blob/main/data/reference-photos/${photo}`) throw new Error(`Record ${a.id}: reference artwork requires its original source photo`);
      }
    } else if (a.coverStatus !== 'pending') throw new Error(`Record ${a.id}: missing artwork must be marked pending`);
    if (a.summary && !(a.summarySource && a.summarySourceLabel)) throw new Error(`Record ${a.id}: album summary requires a labelled source`);
    if (!!a.artistInfoUrl !== !!a.artistInfoLabel) throw new Error(`Record ${a.id}: artist information requires a labelled link`);
    if (!['Photo checked','Needs verification'].includes(a.verificationStatus)) throw new Error(`Record ${a.id}: invalid verification status`);
    if (a.verificationStatus === 'Needs verification' && !a.verificationIssues.length) throw new Error(`Record ${a.id}: explain what needs verification`);
    if (a.pricePaid && (!/^\d+(\.\d{1,2})?$/.test(a.pricePaid) || !/^[A-Z]{3}$/.test(a.purchaseCurrency))) throw new Error(`Record ${a.id}: price paid requires a non-negative amount and ISO currency`);
    if (a.purchaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(a.purchaseDate)) throw new Error(`Record ${a.id}: purchase date must be YYYY-MM-DD`);
  }
  const trackKeys = new Set();
  for (const row of trackRows) {
    const id = row['Collection ID'];
    if (!ids.has(id)) throw new Error(`Track refers to unknown record ${id}`);
    const side = row.Side;
    const number = row['Track Number'];
    const key = [id,side,number].join(':');
    if (!side || !/^\d+$/.test(number) || Number(number) < 1 || trackKeys.has(key)) throw new Error(`Invalid or duplicate track ${key}`);
    trackKeys.add(key);
    if (!(row['Title (Japanese)'] || row['Title (English/Romanization)'])) throw new Error(`Track ${key} has no title`);
    albums.find(a => a.id === id).tracks.push({
      side,number,titleJa:row['Title (Japanese)'] || '',titleEn:row['Title (English/Romanization)'] || '',duration:row.Duration || '',
    });
  }
  const dates = albumRows.map(row => row['Last Updated']).filter(Boolean).sort();
  if (dates.length !== albums.length || dates.some(d => !/^\d{4}-\d{2}-\d{2}$/.test(d))) throw new Error('Every album needs a Last Updated date (YYYY-MM-DD).');
  return {version:2,albumCount:albums.length,updatedAt:dates.at(-1),albums};
}

