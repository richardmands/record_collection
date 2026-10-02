import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const matches=read('data/research/discogs-matches.json');
const audit=read('.work/discogs-release-audit.json');
const output={};
for(const [id,releaseId] of Object.entries(matches)){
 const file=`.work/discogs-releases/${releaseId}.json`;
 const r=fs.existsSync(file)?read(file):audit.find(a=>a.release.id===releaseId)?.release;
 if(!r)throw new Error(`Missing release ${releaseId}`);
 output[id]={releaseId,url:`https://www.discogs.com/release/${releaseId}`,title:r.title,year:r.year||null,country:r.country||'',labels:(r.labels||[]).map(l=>`${l.name} (${l.catno})`),genres:r.genres||[],styles:r.styles||[],tracks:(r.tracklist||[]).flatMap(t=>t.sub_tracks?.length?t.sub_tracks:[t]).filter(t=>t.type_!=='heading').map(t=>({position:t.position,title:t.title,duration:t.duration||''})),retrievedAt:'2026-10-02'};
}
fs.writeFileSync('data/research/discogs-enrichment.json',JSON.stringify(output,null,2)+'\n');
console.log(`Prepared Discogs details for ${Object.keys(output).length} records.`);
