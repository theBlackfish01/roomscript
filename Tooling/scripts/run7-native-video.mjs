/** Local native VideoRecorder recovery. Reads Lens temp/cache only; never records a screen or uploads. */
import {readdirSync,statSync,lstatSync,readFileSync,writeFileSync,mkdirSync,openSync,readSync,closeSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,join,extname} from 'node:path';import {tmpdir} from 'node:os';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url))),out=join(root,'Tooling/results/run7-native-video');mkdirSync(out,{recursive:true});
const marker=join(out,'window.json'),report=join(out,'discovery.json'),mode=process.argv[2]||'discover';
if(mode==='mark'){writeFileSync(marker,JSON.stringify({started:new Date().toISOString(),note:'Run native five-second probe next; no recorder execution by this script.'},null,2)+'\n');console.log('Marked native recording search window.');process.exit(0);}
if(!existsSync(marker))throw Error('Run mark immediately before the LEAF recorder probe.');
const since=Date.parse(JSON.parse(readFileSync(marker,'utf8')).started)-1000,temp=tmpdir();
const roots=[{path:temp,depth:0},...readdirSync(temp,{withFileTypes:true}).filter(d=>d.isDirectory()&&d.name.startsWith('LensStudio_')).map(d=>({path:join(temp,d.name),depth:8})),{path:join(process.env.LOCALAPPDATA||'','Snap','Lens Studio','cache'),depth:5}];
const deadline=Date.now()+45000,candidates=[],errors=[];let visited=0,truncated=false;
function walk(path,depth){
  if(Date.now()>deadline||visited>40000){truncated=true;return;}
  let entries;try{entries=readdirSync(path,{withFileTypes:true});}catch(error){errors.push({path,code:error.code});return;}
  for(const entry of entries){if(Date.now()>deadline||visited++>40000){truncated=true;return;}const file=join(path,entry.name);if(entry.isSymbolicLink())continue;
    if(entry.isDirectory()){if(depth>0&&!['QtWebEngine','logs','pendingAnalytics','PluginsPreferences','Workspaces'].includes(entry.name))walk(file,depth-1);continue;}
    if(!entry.isFile())continue;let stat;try{stat=statSync(file);}catch{continue;}if(stat.mtimeMs<since||stat.size<32||['.mp3','.wav','.png','.jpg','.jpeg'].includes(extname(file).toLowerCase()))continue;
    let fd;try{fd=openSync(file,'r');const head=Buffer.alloc(16);readSync(fd,head,0,16,0);if(head.toString('ascii',4,8)!=='ftyp')continue;
      candidates.push({path:file,bytes:stat.size,modified:new Date(stat.mtimeMs).toISOString(),brand:head.toString('ascii',8,12)});
    }catch(error){errors.push({path:file,code:error.code});}finally{if(fd!==undefined)closeSync(fd);}
  }
}
for(const target of roots)walk(target.path,target.depth);
const result={at:new Date().toISOString(),since:new Date(since).toISOString(),visited,truncated,candidates,errors};
if(mode==='copy'){
  if(candidates.length!==1)throw Error('Expected exactly one new native MP4; found '+candidates.length+'. Run discover and inspect provenance before selecting a file.');
  const candidate=candidates[0],dest=join(out,'native-'+Date.parse(candidate.modified)+'.mp4');
  // Source was discovered under the fixed Lens/temp roots; destination stays in this task output directory.
  if(lstatSync(candidate.path).isSymbolicLink())throw Error('Refusing symlink source');copyFileSync(candidate.path,dest);
  const ffmpeg=join(root,'Tooling/audio/out/bin/ffmpeg.exe');let metadata='';
  try{execFileSync(ffmpeg,['-hide_banner','-i',dest],{windowsHide:true,timeout:15000,stdio:['ignore','ignore','pipe']});}catch(error){metadata=String(error.stderr||'');}
  result.copied={path:dest,duration:metadata.match(/Duration: ([\d:.]+)/)?.[1]||null,video:metadata.includes('Video:'),audio:metadata.includes('Audio:')};
  execFileSync(ffmpeg,['-v','error','-i',dest,'-f','null','-'],{windowsHide:true,timeout:45000,stdio:['ignore','ignore','pipe']});
  result.copied.decoded=true;
}
writeFileSync(report,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
