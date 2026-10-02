import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const searches=read('data/research/snow-records-search-2026-10-02.json');
const inspected=read('.work/retail-inspected.json');
const picks={'06':'180630709','13':'189067549','34':'90470853','37':'178682900','43':'187429190','44':'193148759','52':'100873489','57':'100866904','58':'193584855','63':'90200690','74':'136340710','77':'174161469','87':'160037441','88':'89805366','119':'89738131','132':'181534370','140':'160534214','141':'184019216'};
const imageMatched=new Set(['13','34','37','43','52','63','74','119','141']);
const facts={
 '06':'Two listings corroborate ALW-46–47 and the full title. Year remains unknown.',
 '13':'Sleeve and label inspected: SJL-2080 is correct. The sleeve lists 春の海, 比良, 瀬音, 雨韻, コスモス, せきれい, 紅薔薇. Programme order and sides still need checking.',
 '34':'Cover matches the reference photograph. Listing specifies SJV-836–7, two LPs, 22 tracks, and release year 1975 despite the title’s “76”.',
 '37':'Cover matches the black Sony SQ sleeve. Listing specifies SPEC-94019 and 10 tracks. Year is printed as 19?? in the listing, so remains unknown.',
 '43':'Cover matches. Listing specifies KKS-4054, Columbia, 1972 and 15 tracks. Back-cover song titles transcribed below; side assignments not yet established.',
 '44':'Title-specific lead: ゴールデンテレビまんが大行進１, KX-7. Other volumes in the series are different albums.',
 '52':'Title-specific lead: Jukebox 5, TP-60498. Other Jukebox volumes still need separate matches.',
 '57':'Rejected sleeve candidate: YL-2113/2114 shows a black cat and advertises 24 tracks; your sleeve shows purple flowers and advertises 32 tracks. Search needs a different release.',
 '58':'LP lead SJX-8529-M. Its title matches; distinguish it from same-title singles and other compilations.',
 '63':'LP lead SJX-8524-M, unlike the earlier four-track EP candidate.',
 '74':'LP lead RVL-10010, Very Best / Ai no Tobira. RVS-1115 is a different single and is not this album.',
 '77':'Title-specific lead ILS-80215, Stomu Yamashta and Red Buddha Theatre.',
 '87':'Title-specific lead 38AH11–12; sleeve and track programme comparison pending.',
 '88':'Title-specific lead 25AH25; sleeve and track programme comparison pending.',
 '119':'Snow Records lists Deja Vu under Marlene, catalogue 28AH1514. The pink sofa cover matches your photograph and identifies the artist as Marlene; the current Miki Matsubara attribution needs correction.',
 '132':'The Best has several different releases. 25AH602 has a red feather dress cover, unlike your sports-shirt cover, so this candidate is rejected. Check 25AH749 and 44AH1085–6 next.',
 '140':'Possible title lead: 美空ひばりの流し唄, ACE-7047. The listing has a purple kimono cover, unlike your white-kimono/moon sleeve, so this candidate is rejected.',
 '141':'Front cover matches the framed reference photograph. Listing specifies SKA-36, King, 1972 and 14 tracks. Back-cover programme image inspected; small text still needs careful transcription.'
};
const programme43=['ピンポンパン体操','正調デベロン音頭','ピンクの戦車','せんろはつづくよどこまでも','手のひらをたいように','ピンポンパンのうた','ピンクのバニー','やぎさんのゆうびん','ことりのうた','ぞうさん','パジャママンのうた','おふろのかぞえうた','山のおんがくか','おもちゃのチャチャチャ','おなかのへるうた'];
const output=searches.map(s=>{
 const pid=picks[s.id], url=pid?`https://www.snowrecords.jp/?pid=${pid}`:null;
 const details=inspected.find(x=>x.id===s.id&&x.url===url);
 return {id:s.id,searchedAt:'2026-10-02',query:s.query,searchUrl:s.url,status:['57','132','140'].includes(s.id)?'Candidate rejected':imageMatched.has(s.id)?'Cover matched':pid?'Possible album match':'No specific album match',note:facts[s.id]||(['64','66','67','72'].includes(s.id)?'The sleeve has too little readable identifying text for a reliable text search. No artist identity inferred from the portrait.':'Searched Japanese titles and available details on Snow Records and in indexed Snow Records/Qoo10 results. No sufficiently specific listing established.'),sources:url?[url]:[],images:details?.images||[],programme:s.id==='43'?programme43:[]};
});
output.find(x=>x.id==='37').sources.push('https://www.qoo10.jp/gmkt.inc/Mobile/Goods/Goods.aspx?goodscode=1165574978');
const saved=read('data/research/retail-research.json');
for(const row of saved.filter(r=>r.ownerSubmitted || r.id==='68' || r.sources.some(url=>!url.includes('snowrecords.jp') && !url.includes('qoo10.jp')))){const i=output.findIndex(r=>r.id===row.id);if(i>=0)output[i]=row;}
fs.writeFileSync('data/research/retail-research.json',JSON.stringify(output,null,2)+'\n');
console.log(`${output.length} researched; ${output.filter(x=>x.sources.length).length} specific leads; ${output.filter(x=>x.status==='Cover matched').length} covers matched.`);
