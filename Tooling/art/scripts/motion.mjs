// Four original deterministic 1080p30 edit overlays. These are motion graphics, not Lens footage.
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {heroWord,palette as P,path,text,line,M,L,Z} from '../lib/vectors.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..'),REPO=resolve(ROOT,'../..'),video=resolve(REPO,'devpost/media/video');
const ffmpeg=process.env.FFMPEG||resolve(REPO,'Tooling/audio/out/bin/ffmpeg.exe');
if(!existsSync(ffmpeg))throw Error('Set FFMPEG to an installed ffmpeg executable; nothing is downloaded by this runner');
mkdirSync(video,{recursive:true});const manifest=[];
const clamp=v=>Math.max(0,Math.min(1,v));
const rect=(x,y,w,h,col)=>path([M(x,y),L(x+w,y),L(x+w,y+h),L(x,y+h),Z()],col,3);
const putWord=(word,w,h,x,y,alpha=1)=>heroWord(word,w,h).items.map(a=>({...a,alpha,transform:[x,y,0]}));
const duration={Title:4,Objection:3,EndCard:4,UnderTheHood:5};
for(const [name,seconds] of Object.entries(duration)){
  const frames=join(ROOT,'out/motion',name);mkdirSync(frames,{recursive:true});const jobs=[];
  for(let f=0;f<seconds*30;f++){
    const t=f/30,fade=clamp((seconds-t)/.45),items=[];
    for(let i=0;i<50;i++){const x=(i*433)%1920,y=((i*251)-t*(13+i%9)+1080)%1080;items.push(line(x,y,x-3,y+13,P.ivory,.7,{alpha:.15*fade}))}
    if(name==='Title'){
      const a=clamp((t-.2)/.9)*fade;items.push(...putWord('ROOMSCRIPT',1700,340,110,295,a),line(520,690,1400,690,P.brass,3,{alpha:a}),text('A MURDER IN YOUR ROOM',960,745,43,P.ivory,{align:'center',alpha:clamp(t-1.2)*fade}),text('CASE HARLOW / 1041',960,830,27,P.yellow,{align:'center',alpha:clamp(t-1.8)*fade}));
    }else if(name==='Objection'){
      const inT=clamp((t-.25)/.12),scale=1+(1-inT)*.7,impact=t>=.37&&t<.47?[14,-11,7][Math.min(2,Math.floor((t-.37)*30))]:0;
      if(t>=.25)items.push(...putWord('OBJECTION!',1600*scale,360*scale,(1920-1600*scale)/2+impact,340-(scale-1)*180,inT*fade));
      for(let i=0;i<24;i++){const x=i*85+((t*180)%85);items.push(path([M(x,270),L(x+30,292),L(x,314),M(x,761),L(x+30,783),L(x,805)],P.yellow,5,{alpha:clamp((t-.37)*5)*fade}))}
      items.push(line(180,893,1740,893,P.coral,6,{alpha:fade}),line(180,859-t*25,1740,859-t*25,P.cyan,4,{alpha:clamp(1.8-t),dash:true}));
    }else if(name==='EndCard'){
      const a=clamp(t/.6)*fade;items.push(...putWord('CASE CLOSED',1650,310,135,220,a),line(430,612,1490,612,P.brass,3,{alpha:a}),text('Every small lie told you where they stood.',960,674,40,P.ivory,{align:'center',alpha:a}),text('ROOMSCRIPT',960,810,39,P.yellow,{align:'center',alpha:a}),text('Built with Lens Studio + CLAD',960,880,28,P.ivory,{align:'center',alpha:a}));
    }else{
      const a=clamp(t/.5)*fade;items.push(...putWord('THE TRUTH',1180,220,370,45,a),text('A DETERMINISTIC ENGINE. A VOICE FOR EVERY CHARACTER.',960,290,30,P.ivory,{align:'center',alpha:a}));
      const boxes=[{x:100,col:P.brass,title:'CASE ENGINE',sub:'Facts / lies / verdict',label:'DECIDES TRUTH'},{x:710,col:P.cyan,title:'AI DIRECTOR',sub:'Chooses approved IDs',label:'DIRECTS DELIVERY'},{x:1320,col:P.ivory,title:'BUNDLED CAST',sub:'Voices / poses / tells',label:'PERFORMS THE LINE'}];
      boxes.forEach((b,i)=>{const vis=clamp((t-.4-i*.5)/.4)*fade;items.push({...rect(b.x,418,500,330,b.col),alpha:vis},text(b.title,b.x+250,458,35,b.col,{align:'center',alpha:vis}),text(b.sub,b.x+250,558,27,P.ivory,{align:'center',alpha:vis}),text(b.label,b.x+250,667,24,P.yellow,{align:'center',alpha:vis}));if(i<2)items.push(path([M(b.x+522,581),L(b.x+588,581),L(b.x+570,566),M(b.x+588,581),L(b.x+570,596)],P.brass,3,{alpha:vis}))});
      items.push(text('Every admitted performance is logged and replayable.',960,867,32,P.ivory,{align:'center',alpha:clamp(t-2.3)*fade}));
    }
    jobs.push({width:1920,height:1080,scale:1,background:'#080C13',items,output:join(frames,String(f).padStart(4,'0')+'.png')});
  }
  const batch=join(ROOT,'out',name+'-frames.json');writeFileSync(batch,JSON.stringify(jobs));
  execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',join(ROOT,'scripts/render.ps1'),'-Batch',batch],{timeout:300000,stdio:'inherit',windowsHide:true});
  const target=join(video,name+'.mp4');execFileSync(ffmpeg,['-y','-loglevel','error','-framerate','30','-i',join(frames,'%04d.png'),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart','-threads','2',target],{timeout:300000,stdio:'inherit',windowsHide:true});
  const data=readFileSync(target);manifest.push({file:name+'.mp4',seconds,fps:30,width:1920,height:1080,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),provenance:'Original procedural motion graphic, not Lens capture'});
  console.log('Encoded',name,seconds+'s');
}
writeFileSync(join(video,'manifest.json'),JSON.stringify({schema:1,clips:manifest},null,2)+'\n');
