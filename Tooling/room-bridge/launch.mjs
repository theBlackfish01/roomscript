/** Bounded Preview HTTPS relay, no GUI and no provider key in Assets. */
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {randomBytes} from 'node:crypto';import {fileURLToPath} from 'node:url';
const directory=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(directory,'../..'),config=path.join(root,'Assets/Scripts/Content/LocalBridgeSession.ts'),sessionPath=path.join(directory,'session.json');
const token='rsb_'+randomBytes(32).toString('hex');fs.writeFileSync(sessionPath,JSON.stringify({token}));
const server=spawn(process.execPath,[path.join(directory,'server.mjs')],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
const relay=spawn(path.join(root,'Tooling/bin/cloudflared.exe'),['tunnel','--url','http://127.0.0.1:8787','--no-autoupdate','--protocol','http2'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
let ready=false,closed=false;const accept=chunk=>{const text=String(chunk),url=text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(url&&!ready){ready=true;fs.writeFileSync(config,'/** Ephemeral Preview relay; clear before committing. */\nexport const LOCAL_BRIDGE_SESSION = '+JSON.stringify({url:url[0],token})+';\n');console.log(JSON.stringify({event:'preview_https_ready',url:url[0],seconds:570}));}};
relay.stdout.on('data',accept);relay.stderr.on('data',accept);server.stdout.on('data',data=>{const text=String(data);if(!text.includes(token))process.stdout.write(text);});
const close=()=>{if(closed)return;closed=true;relay.kill();server.kill();fs.writeFileSync(config,'/** Empty in git. Tooling opens a bounded, authenticated Preview session. */\nexport const LOCAL_BRIDGE_SESSION = {url:"",token:""};\n');try{fs.unlinkSync(sessionPath);}catch{}console.log('Preview relay closed; session cleared.');};
relay.on('error',()=>{console.error('Relay executable unavailable.');close();});server.on('error',()=>{console.error('Local server unavailable.');close();});
server.on('exit',()=>{if(!closed){console.error('Local server stopped; relay closed.');close();}});
process.on('SIGINT',()=>{close();process.exit(0);});process.on('SIGTERM',()=>{close();process.exit(0);});
setTimeout(()=>{if(!ready){console.error('HTTPS relay unavailable; recorded scan remains available.');close();process.exitCode=1;}},45000).unref();
setTimeout(close,570000);
