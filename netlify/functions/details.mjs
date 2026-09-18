import {getStore} from '@netlify/blobs';
import collection from '../../public/data/collection.json' with {type:'json'};
import {createDetailsHandler} from '../lib/details.mjs';
export default createDetailsHandler({albums:collection.albums,getStore:()=>getStore({name:'private-details-submissions',consistency:'strong'})});
export const config={rateLimit:{action:'rate_limit',windowSize:60,windowLimit:30,aggregateBy:['ip','domain']}};
