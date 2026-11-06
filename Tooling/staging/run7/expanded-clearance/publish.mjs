import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='Tooling/staging/run7/expanded-clearance/',hashes=JSON.parse(readFileSync(dir+'base-hashes.json','utf8'));
for(const [name,hash] of Object.entries(hashes))if(createHash('sha256').update(readFileSync('Assets/Scripts/'+name)).digest('hex')!==hash)throw Error('Rebase required: '+name);
if(existsSync('Assets/Scripts/RoomscriptPanelClearance.ts'))throw Error('Helper already exists; inspect before publish.');
for(const name of [...Object.keys(hashes),'RoomscriptPanelClearance.ts'])writeFileSync('Assets/Scripts/'+name,readFileSync(dir+name));
console.log('Published expanded card surface-clearance batch. Main registry parameters: memory-cards capture=none,hold=10.');
