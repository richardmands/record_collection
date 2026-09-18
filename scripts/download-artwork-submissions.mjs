// Owner-only retrieval for review. Never pass the key on the command line or commit it.
import fs from 'node:fs/promises';
const key=process.env.ARTWORK_ADMIN_KEY;
if(!key)throw new Error('Set ARTWORK_ADMIN_KEY in your local process environment first.');
const endpoint='https://richardsrecords.netlify.app/.netlify/functions/artwork';
const headers={Authorization:`Bearer ${key}`};
const response=await fetch(endpoint,{headers});
if(!response.ok)throw new Error(`Could not retrieve submissions (${response.status}).`);
const {submissions}=await response.json();
const directory='.work/artwork-submissions';await fs.mkdir(directory,{recursive:true});
for(const entry of submissions){
 if(!/^\d{2,}$/.test(entry.albumId))throw new Error('Unexpected album ID');
 const image=await fetch(`${endpoint}?album=${entry.albumId}`,{headers});
 if(!image.ok)throw new Error(`Could not download album ${entry.albumId}.`);
 await fs.writeFile(`${directory}/${entry.albumId}.jpg`,Buffer.from(await image.arrayBuffer()));
}
await fs.writeFile(`${directory}/manifest.json`,JSON.stringify(submissions,null,2)+'\n');
console.log(`Downloaded ${submissions.length} candidates to ${directory}. Review before publishing.`);
