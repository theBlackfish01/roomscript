/** Typed Preview companion. This contacts our own Tooling bridge, never Lens MCP. */
import fs from 'node:fs';import {fileURLToPath} from 'node:url';import path from 'node:path';
const args=process.argv.slice(2),target=args[0]==='--wren'?'wren':'suspect',question=(target==='wren'?args.slice(1):args).join(' ').trim();if(!question||question.length>1000)throw new Error('Pass a question up to1000 characters.');
const session=JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),'session.json'),'utf8'));
const response=await fetch('http://127.0.0.1:8787/input',{method:'POST',headers:{'Content-Type':'application/json','X-Roomscript-Session':session.token},body:JSON.stringify({question,target}),signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error('Preview companion unavailable.');console.log('Question queued for '+target+'.');
