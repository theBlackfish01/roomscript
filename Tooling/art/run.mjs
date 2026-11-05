// Production offline renderer. All external processes have <= 5 minute timeouts.
// Native GDI rasterization is the dependency-free fallback when package downloads are unavailable.
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,copyFileSync,cpSync} from 'node:fs';
import {dirname,resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {CAST,POSES,portrait,victim,heroWord,hands,palette as P,path,ellipse,text,line,M,L,C,Z} from './lib/vectors.mjs';
import {writeProps} from './lib/glb.mjs';
const ROOT=dirname(fileURLToPath(import.meta.url)),SOURCE_REPO=resolve(ROOT,'../..');
const args=process.argv.slice(2),only=args.includes('--only')?args[args.indexOf('--only')+1]:'portraits,cards,props,graphics,sheet';
const staging=args.includes('--stage'),REPO=staging?resolve(ROOT,'out/run6'):SOURCE_REPO;
if(staging&&!existsSync(resolve(REPO,'Assets/Art')))cpSync(resolve(SOURCE_REPO,'Assets/Art'),resolve(REPO,'Assets/Art'),{recursive:true});
const groups=new Set(only.split(','));
const jobs=[],manifest=[];
const out=resolve(ROOT,'out'),assets=resolve(REPO,'Assets/Art');mkdirSync(out,{recursive:true});
function add(file,job,meta={}){const output=resolve(REPO,file);jobs.push({...job,output});manifest.push({path:file,...meta});}
function png(file,job,meta={}){add('Assets/Art/'+file,job,meta)}
if(groups.has('portraits')){
  for(const c of CAST)for(const p of POSES)png(`Actors/${c.key}/${c.key}-${p}.png`,portrait(c,p),{kind:'portrait',suspect:c.id,pose:p,anchor:c.anchor});
  for(const c of CAST){
    png(`Ghosts/${c.key}-claim.png`,portrait(c,'neutral','claim'),{kind:'ghost',suspect:c.id,mode:'claim'});
    png(`Ghosts/${c.key}-truth.png`,portrait(c,'broken',c.id==='S2'?'truth':'innocent'),{kind:'ghost',suspect:c.id,mode:'truth'});
    png(`Ghosts/${c.key}-suggestion.png`,portrait(c,'neutral','suggestion'),{kind:'ghost',suspect:c.id,mode:'suggestion'});
    const mouth=[];for(let i=0;i<4;i++)mouth.push(ellipse(i*128+33,27,62,Math.max(2,i*11),P.ivory,2));
    png(`Actors/${c.key}/${c.key}-mouth-atlas.png`,{width:512,height:64,items:mouth},{kind:'mouth-atlas',suspect:c.id,frames:4,columns:4});
    const blink=[];for(let i=0;i<4;i++)for(let side=0;side<2;side++)blink.push(path([M(i*128+17+side*54,30),C(i*128+27+side*54,30-(3-i)*3,i*128+36+side*54,30-(3-i)*3,i*128+45+side*54,30)],P.ivory,2.6));
    png(`Actors/${c.key}/${c.key}-blink-atlas.png`,{width:512,height:64,items:blink},{kind:'blink-atlas',suspect:c.id,frames:4,columns:4});
  }
  png('Actors/Harlow/Harlow-standing.png',victim('standing'),{kind:'victim',pose:'standing'});
  png('Actors/Harlow/Harlow-falling.png',victim('falling'),{kind:'victim',pose:'falling'});
}
if(groups.has('cards')){
  execFileSync(process.execPath,[resolve(ROOT,'../node_modules/tsx/dist/cli.mjs'),resolve(ROOT,'scripts/cards-from-case.ts')],{timeout:60000,stdio:'inherit'});
  const data=JSON.parse(readFileSync(join(out,'case.json'),'utf8'));
  for(const card of data.cards){
    const items=[path([M(8,8),L(504,8),L(504,632),L(8,632),Z()],P.coral,3),path([M(28,34),L(484,34),L(484,459),L(28,459),Z()],P.ivory,1.4)];
    // Memory photographs use only the certified evidence caption; no hidden fact is drawn.
    items.push(...objectDrawing(card.objectType,256,253,1.6,P.coral));
    items.push(text(card.time||'OBJECT MEMORY',457,56,19,P.yellow,{align:'center'}));
    const lines=wrap(card.caption,34);if(lines.length>3)throw Error(`Caption overflow ${card.id}: ${lines.length}`);
    lines.forEach((v,i)=>items.push(text(v,31,486+i*30,21,P.ivory)));
    items.push(line(31,595,481,595,P.brass,1),text(card.holderLabel.toUpperCase(),31,606,15,P.coral));
    png(`Cards/Card_${card.id}.png`,{width:512,height:640,items},{kind:'card',evidence:card.id,caption:card.caption,captionLines:lines,facts:card.facts});
  }
}
if(groups.has('graphics')){
  for(const word of ['OBJECTION','CASE CLOSED','THE TRUTH'])png(`UI/Hero/${word.replaceAll(' ','_')}.png`,heroWord(word),{kind:'hero-word',word});
  for(const key of ['Ask','Press','Present','Object','Suggest','Accuse','Glint','Still','Glare','Glove','Composure','Credibility','Hunch']){
    const items=icon(key);png(`UI/Icons/${key}.png`,{width:128,height:128,items},{kind:'icon',id:key});
  }
  png('UI/RefutationFrame.png',{width:512,height:640,items:[path([M(6,6),L(506,6),L(506,634),L(6,634),Z()],P.coral,3),line(28,104,484,104,P.brass,2)]},{kind:'frame'});
  png('UI/ForensicBracket.png',{width:128,height:128,items:[path([M(40,8),L(8,8),L(8,40),M(88,8),L(120,8),L(120,40),M(8,88),L(8,120),L(40,120),M(88,120),L(120,120),L(120,88)],P.brass,3)]},{kind:'frame'});
  png('UI/TapeTile.png',{width:512,height:64,items:Array.from({length:8},(_,i)=>path([M(i*64,0),L(i*64+30,32),L(i*64,64)],P.yellow,10))},{kind:'tile'});
  for(const [name,col] of [['StarFlare',P.yellow],['TruthSpark',P.coral],['ClaimSpark',P.cyan],['GhostDust',P.ivory]]){
    const items=[path([M(64,5),L(69,55),L(123,64),L(69,70),L(64,123),L(58,70),L(5,64),L(58,55),Z()],col,2,{glow:true})];
    if(name==='GhostDust')for(let i=0;i<30;i++){const x=(i*71)%119,y=(i*43)%127;items.push(ellipse(x,y,2,2,col,1,{fill:true,alpha:.35+(i%5)*.1}))}
    png(`FX/${name}.png`,{width:128,height:128,items},{kind:'fx'});
  }
  png('FX/UVDrag.png',{width:512,height:128,items:Array.from({length:12},(_,i)=>path([M(13,48+i*3),C(150,18+i*7,240,103-i*3,498,56+i*2)],P.violet,1.3,{alpha:.12+(i%3)*.14}))},{kind:'fx'});
  png('FX/BlackoutEyes.png',{width:256,height:64,items:[line(29,30,94,24,P.ivory,2.4),line(160,24,226,30,P.ivory,2.4)]},{kind:'fx'});
  png('FX/CupBead.png',{width:128,height:128,items:[ellipse(42,34,44,59,P.ivory,2.6),path([M(53,42),C(45,54,47,65,50,68)],P.ivory,3)]},{kind:'fx'});
  png('FX/Shard.png',{width:128,height:128,items:[path([M(23,15),L(108,48),L(51,114),Z()],P.ivory,2)]},{kind:'fx'});
}
if(jobs.length){
  const batch=join(out,'batch.json');writeFileSync(batch,JSON.stringify(jobs));
  execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',join(ROOT,'scripts/render.ps1'),'-Batch',batch],{timeout:300000,stdio:'inherit',windowsHide:true});
  const metrics=JSON.parse(readFileSync(batch+'.metrics.json','utf8').replace(/^\uFEFF/,''));
  for(const m of manifest){const stat=metrics.find(s=>s.path===resolve(REPO,m.path));if(stat)m.metrics={...stat,path:undefined};}
}
if(groups.has('props'))manifest.push(...writeProps(assets));
if(groups.has('sheet'))renderSheets();
const prior=existsSync(join(ROOT,'manifest.json'))?JSON.parse(readFileSync(join(ROOT,'manifest.json'),'utf8')).assets:[];
const merged=[...new Map([...prior,...manifest].map(a=>[a.path,a])).values()].sort((a,b)=>a.path.localeCompare(b.path));
for(const m of merged){const data=readFileSync(resolve(REPO,m.path));m.bytes=data.length;m.sha256=createHash('sha256').update(data).digest('hex');}
writeFileSync(join(staging?REPO:ROOT,'manifest.json'),JSON.stringify({schema:3,renderer:'native-gdi-engraving-v3',assets:merged},null,2)+'\n');
const registry={actors:CAST.map(c=>({id:c.id,name:c.key,anchor:c.anchor,poses:Object.fromEntries(POSES.map(p=>[p,`Assets/Art/Actors/${c.key}/${c.key}-${p}.png`])),mouthAtlas:`Assets/Art/Actors/${c.key}/${c.key}-mouth-atlas.png`,blinkAtlas:`Assets/Art/Actors/${c.key}/${c.key}-blink-atlas.png`,atlasFrames:4})),cards:merged.filter(a=>a.kind==='card').map(a=>({id:a.evidence,path:a.path,facts:a.facts})),props:merged.filter(a=>a.kind==='glb').map(a=>({id:a.object,path:a.path,heightMeters:a.heightMeters})),heroWords:merged.filter(a=>a.kind==='hero-word').map(a=>({id:a.word,path:a.path}))};
mkdirSync(join(ROOT,'generated'),{recursive:true});
writeFileSync(join(staging?REPO:ROOT,staging?'ArtManifest.ts':'generated/ArtManifest.ts'),'// Generated by Tooling/art/run.mjs. Handoff data only; not yet wired to Lens.\nexport const ROOMSCRIPT_ART = '+JSON.stringify(registry,null,2)+' as const;\n');
const budget={assetCount:merged.length,totalBytes:merged.reduce((n,a)=>n+a.bytes,0),portraitDecodedBytes:20*512*1024*4,notes:'Disk source bytes are not a Lens build measurement. Ghosts and atlases count additionally if wired.'};
writeFileSync(join(out,'budget.json'),JSON.stringify(budget,null,2)+'\n');console.log(JSON.stringify(budget));
function wrap(s,count){const lines=[];let l='';for(const w of s.split(/\s+/)){if((l+' '+w).trim().length>count){lines.push(l);l=w}else l+=(l?' ':'')+w}if(l)lines.push(l);return lines}
function objectDrawing(kind,x,y,scale=1,color=P.ivory){let a=[];
  if(kind==='cup')a=[path([M(-42,-45),L(39,-45),L(32,40),C(0,53,-24,47,-34,37),Z()],color,2),ellipse(37,-30,35,51,color,2)];
  else if(kind==='clock')a=[ellipse(-66,-66,132,132,color,2),line(0,0,0,-46,color,3),line(0,0,31,25,color,3)];
  else if(kind==='cord')a=[path([M(-80,-30),C(-30,-90,42,83,78,13),C(93,-20,40,-66,12,-31),C(-12,0,47,52,80,17)],color,3),line(-80,-30,-100,-15,color,5)];
  else if(kind==='kettle')a=[path([M(-42,-35),C(-61,-10,-51,35,-29,44),L(30,44),C(55,28,54,-11,36,-34),Z()],color,2),path([M(39,-15),L(84,-38),L(66,-4),L(48,14)],color,2),path([M(-45,-24),C(-92,-39,-84,37,-48,30)],color,3),line(-34,-40,31,-40,color,3)];
  else if(kind==='screen')a=[path([M(-81,-45),L(81,-45),L(81,47),L(-81,47),Z()],color,2),ellipse(-55,-24,43,43,color,2),ellipse(13,-24,43,43,color,2),line(-58,30,57,30,color,3)];
  else if(kind==='light')a=[path([M(-67,-20),L(-30,-76),L(28,-76),L(63,-20),Z()],color,2),line(0,-20,0,63,color,3),line(-41,63,41,63,color,3)];
  else a=[path([M(-65,-60),L(43,-60),L(65,-40),L(65,63),L(-65,63),Z()],color,2),line(-43,-30,37,-30,color,2),line(-43,-10,43,-10,color,2),line(-43,10,32,10,color,2),line(-43,30,39,30,color,2)];
  return a.map(i=>({...i,path:i.path?.map(c=>c[0]==='Z'?c:[c[0],...c.slice(1).map((v,j)=>v*scale+(j%2?y:x))]),x:i.x===undefined?undefined:i.x*scale+x,y:i.y===undefined?undefined:i.y*scale+y,w:i.w*scale,h:i.h*scale}));
}
function icon(key){const col=['Object','Accuse','Credibility'].includes(key)?P.coral:['Ask','Suggest'].includes(key)?P.cyan:P.yellow;
  const core={Ask:[path([M(24,24),L(104,24),L(104,81),L(65,81),L(42,106),L(42,81),L(24,81),Z()],col,3)],Press:[line(33,25,33,94,col,5),line(64,17,64,104,col,5),line(95,25,95,94,col,5)],Present:[path([M(26,20),L(97,20),L(97,103),L(26,103),Z()],col,3),line(40,42,82,42,col,3),line(40,58,82,58,col,3)],Object:[path([M(28,25),L(102,99),M(102,25),L(28,99)],col,7)],Suggest:[ellipse(25,22,77,77,col,3),line(64,4,64,22,col,3),line(64,99,64,119,col,3),line(6,61,25,61,col,3),line(102,61,121,61,col,3)],Accuse:[path([M(28,35),L(81,18),L(103,73),L(51,91),Z()],col,3),line(59,89,39,113,col,6)],Glove:hands(64,75,0,true),Glare:[ellipse(15,40,42,35,col,3),ellipse(72,40,42,35,col,3),line(57,53,72,53,col,3)],Still:[line(41,23,41,103,col,8),line(87,23,87,103,col,8)],Composure:[ellipse(22,22,84,84,col,3),line(64,36,64,65,col,4),line(64,65,85,77,col,4)],Credibility:[path([M(64,15),L(105,35),L(94,89),L(64,112),L(34,89),L(23,35),Z()],col,3),path([M(42,63),L(58,80),L(87,47)],col,4)],Hunch:[path([M(45,85),C(5,39,37,17,65,17),C(98,17,116,50,83,85),Z()],col,3),line(45,97,83,97,col,4),line(53,110,75,110,col,4)]};
  return core[key]||[path([M(64,9),L(72,54),L(118,64),L(72,74),L(64,119),L(55,74),L(9,64),L(55,54),Z()],col,3)];}
function renderSheets(){
  const captures=join(REPO,'docs/captures');mkdirSync(captures,{recursive:true});
  const before=join(captures,'2026-11-04-art-before.jpg');if(!existsSync(before))copyFileSync(join(SOURCE_REPO,'docs/reviews/2026-11-03-media/asset-contact-sheet.jpg'),before);
  const items=[text('ROOMSCRIPT / ENGRAVED LIGHT',26,18,32,P.yellow),text('ART DIRECTION V3  -  PROCEDURAL ASSETS, NOT LENS CAPTURES',26,62,17,P.ivory)];
  CAST.forEach((c,row)=>{items.push(text(c.name,26,104+row*358,18,P.brass));POSES.forEach((p,col)=>{const x=26+col*196,y=134+row*358;items.push({type:'image',path:join(assets,`Actors/${c.key}/${c.key}-${p}.png`),x,y,w:160,h:320});items.push(text(p.toUpperCase(),x,y+307,13,P.ivory))})});
  const sheet={width:1010,height:1550,scale:1,background:'#0D1118',items,output:join(captures,'2026-11-05-art-after-poses.png')};
  const thumbs={width:1040,height:640,scale:1,background:'#12151C',items:[text('IVORY STROKES / FOUR SILHOUETTES',24,18,28,P.yellow)],output:join(captures,'2026-11-05-art-after-thumbnails.png')};
  CAST.forEach((c,i)=>{thumbs.items.push({type:'image',path:join(assets,`Actors/${c.key}/${c.key}-neutral.png`),x:34+i*256,y:85,w:208,h:416},text(c.role,138+i*256,515,17,P.brass,{align:'center'}),text(c.key.toUpperCase(),138+i*256,545,23,P.ivory,{align:'center'}))});
  const batch=join(out,'sheet.json');writeFileSync(batch,JSON.stringify([sheet,thumbs]));execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',join(ROOT,'scripts/render.ps1'),'-Batch',batch],{timeout:120000,stdio:'inherit',windowsHide:true});
}
