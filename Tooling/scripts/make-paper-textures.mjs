// Run 9 paper objects (ART_2D "Props and paper objects"): procedural, deterministic paper textures, made locally
// with sharp. No third-party art. Writes Assets/Art/Paper/*.png. Usage: node Tooling/scripts/make-paper-textures.mjs
import {mkdirSync} from 'node:fs';import {join} from 'node:path';import {createRequire} from 'node:module';
const root=process.cwd(),out=join(root,'Assets/Art/Paper');mkdirSync(out,{recursive:true});
const require=createRequire(join(root,'Tooling/art2d/package.json'));const sharp=require('sharp');
let seed=1041;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
// value noise for fibres and blotches
const grid=(gw,gh)=>{const g=Array.from({length:(gw+1)*(gh+1)},rnd);return (x,y)=>{const fx=x*gw,fy=y*gh,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,s=t=>t*t*(3-2*t),a=g[iy*(gw+1)+ix],b=g[iy*(gw+1)+ix+1],c=g[(iy+1)*(gw+1)+ix],d=g[(iy+1)*(gw+1)+ix+1];return a+(b-a)*s(tx)+((c+(d-c)*s(tx))-(a+(b-a)*s(tx)))*s(ty);};};
async function paper(name,W,H,base,{grain=7,blotch=10,vignette=.12,mask=null,border=null,fine=40}={}){
  const px=Buffer.alloc(W*H*4),n1=grid(8,8),n2=grid(fine,fine);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const u=x/(W-1),v=y/(H-1),i=(y*W+x)*4;
    const edge=Math.min(u,1-u,v,1-v),vig=1-vignette*Math.max(0,1-edge*8);
    const k=vig*(1+(n1(Math.min(u,.999),Math.min(v,.999))-.5)*blotch/100+(n2(Math.min(u,.999),Math.min(v,.999))-.5)*grain/100*2)+(rnd()-.5)*grain/255;
    let [r,g,b]=base.map(c=>c*k);
    if(border&&(x<border.px||y<border.px||x>=W-border.px||y>=H-border.px)){[r,g,b]=border.rgb;}
    px[i]=clamp(r);px[i+1]=clamp(g);px[i+2]=clamp(b);px[i+3]=mask?mask(x,y):255;}
  await sharp(px,{raw:{width:W,height:H,channels:4}}).png({compressionLevel:9,palette:true,quality:90}).toFile(join(out,name+'.png'));console.log(name,W+'x'+H);
}
const MANILA=[236,212,158];
// Folder back: 24 x 18 cm (board 24 x 16 plus a 2 cm tab, top-left from x 1 to 9 cm).
await paper('FolderBack',512,384,MANILA.map(c=>c*.94),{mask:(x,y)=>{const cmx=x/512*24,cmy=y/384*18;if(cmy>=2)return 255;const t=cmy;return cmx>=1+(1-t/2)&&cmx<=9-(1-t/2)?255:0;}});
await paper('FolderCover',512,341,MANILA);
// Coral wax seal with an uneven rim and a pressed inner ring.
{const S=128,px=Buffer.alloc(S*S*4),wob=Array.from({length:24},()=>rnd());
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const dx=x+.5-S/2,dy=y+.5-S/2,r=Math.hypot(dx,dy)/(S/2),a=Math.atan2(dy,dx),k=Math.floor((a+Math.PI)/(2*Math.PI)*24)%24,rim=.86+.1*wob[k];const i=(y*S+x)*4;
    const ring=Math.abs(r-.58)<.05?.72:1,shade=(1-.25*r)*(1+.18*(-dx-dy)/S)*ring;px[i]=clamp(232*shade);px[i+1]=clamp(96*shade);px[i+2]=clamp(78*shade);px[i+3]=r<rim?255:r<rim+.04?clamp(255*(rim+.04-r)/.04):0;}
  await sharp(px,{raw:{width:S,height:S,channels:4}}).png({compressionLevel:9}).toFile(join(out,'WaxSeal.png'));console.log('WaxSeal');}
await paper('Newsprint',512,640,[238,232,214],{grain:6,blotch:4,vignette:.06,fine:200});
await paper('PhotoPaper',256,320,[246,243,234],{grain:3,blotch:3,vignette:.05,fine:120});
// Cork: speckled warm brown with a dark wood frame.
await paper('Cork',512,384,[176,128,80],{grain:34,blotch:22,fine:160,vignette:.05,border:{px:14,rgb:[86,56,34]}});
// Brass push pin head: a domed disc with a highlight.
{const S=64,px=Buffer.alloc(S*S*4);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const dx=(x+.5-S/2)/(S/2),dy=(y+.5-S/2)/(S/2),r=Math.hypot(dx,dy),i=(y*S+x)*4;
    const lit=Math.max(0,1-Math.hypot(dx+.35,dy+.35)*1.4),shade=.62+.38*(1-r*r)+.5*lit*lit;px[i]=clamp(232*shade);px[i+1]=clamp(176*shade);px[i+2]=clamp(74*shade);px[i+3]=r<.92?255:r<1?clamp(255*(1-r)/.08):0;}
  await sharp(px,{raw:{width:S,height:S,channels:4}}).png({compressionLevel:9}).toFile(join(out,'BrassPin.png'));console.log('BrassPin');}
