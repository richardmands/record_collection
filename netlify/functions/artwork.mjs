import { getStore } from '@netlify/blobs';
import collection from '../../public/data/collection.json' with {type:'json'};
import { createArtworkHandler } from '../lib/artwork.mjs';

export default createArtworkHandler({
  albums:collection.albums,
  getStore:()=>getStore({name:'private-artwork-submissions',consistency:'strong'}),
});
export const config={rateLimit:{action:'rate_limit',windowSize:60,windowLimit:30,aggregateBy:['ip','domain']}};
