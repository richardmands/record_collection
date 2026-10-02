import fs from 'node:fs';
const records = JSON.parse(fs.readFileSync('data/research/discogs-unresolved.json', 'utf8'));
const queries = {
 '06':'ALW-46','13':'SJL-2080','34':'SJV-836','37':'地球はひとつ','40':'笹川','43':'ピンポンパン体操','44':'ゴールデンテレビまんが大行進',
 '50':'ジュークボックス１','51':'ジュークボックス２','52':'ジュークボックス５','53':'ジュークボックス６','54':'ジュークボックス９',
 '56':'任侠演歌','57':'演歌ギター全曲集','58':'勘太郎月夜唄','60':'麦と兵隊','63':'アルプスの牧場',
 '64':'グループ ビクター','66':'高道','67':'ビクター 肖像','68':'春日井梅鶯','70':'スチールギター 日本歌謡史','72':'ビクター 肖像',
 '74':'クール・ファイブ ベリー','77':'man from the east','78':'小林旭 ヒット','80':'郷ひろみ','86':'西城秀樹 the best','87':'キャンディーズのすべて','88':'太田裕美のすべて',
 '119':'デジャ','131':'和田アキ子','132':'キャンディーズ the best','140':'美空ひばり 流し','141':'演歌大劇場'
};
fs.mkdirSync('.work/snow-search', {recursive:true});
fs.writeFileSync('.work/snow-queries.json',JSON.stringify(queries));
if(process.argv.includes('--prepare')) process.exit(0);
const encoded=JSON.parse(fs.readFileSync('.work/snow-encoded-queries.json','utf8').replace(/^\uFEFF/,''));
const results = [];
let index = 0;
async function worker() {
 while (index < records.length) {
  const r = records[index++], query = queries[r.id], url = `https://www.snowrecords.jp/?mode=srh&keyword=${encoded[r.id]}`;
  const cache = `.work/snow-search/${r.id}-euc.html`;
  try {
   let html;
   if (fs.existsSync(cache)) html = fs.readFileSync(cache,'utf8');
   else { const response = await fetch(url,{signal:AbortSignal.timeout(20000)}); if (!response.ok) throw new Error(`HTTP ${response.status}`); const bytes=await response.arrayBuffer(); const charset=/charset=([^;]+)/i.exec(response.headers.get('content-type')||'')?.[1]||'euc-jp'; html=new TextDecoder(charset).decode(bytes);fs.writeFileSync(cache,html); }
   const block = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>{try{return JSON.parse(m[1]);}catch{return null;}}).find(x=>x?.['@type']==='SearchResultsPage');
   if (!block) throw new Error('Search results could not be parsed');
   const candidates=(block.mainEntity?.itemListElement||[]).map(x=>({title:x.name,url:new URL(x.url,'https://www.snowrecords.jp/').href,catalogue:x.name.split(' - ').at(-1)||''}));
   results.push({id:r.id,query,url,total:block.mainEntity?.numberOfItems||0,candidates});
   console.log(`${r.id}: ${candidates.length} visible listings (${block.mainEntity?.numberOfItems||0} total)`);
  } catch(e) {results.push({id:r.id,query,url,error:e.message,candidates:[]}); console.log(`${r.id}: ${e.message}`);}
 }
}
await Promise.all([worker(),worker()]);
results.sort((a,b)=>Number(a.id)-Number(b.id));
fs.writeFileSync('data/research/snow-records-search-2026-10-02.json',JSON.stringify(results,null,2)+'\n');
