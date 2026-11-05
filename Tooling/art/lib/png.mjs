// Dependency-free PNG reader for contract tests. Supports 8-bit RGB/RGBA, all PNG row filters.
import {inflateSync} from 'node:zlib';
export function decodePng(buf){
  if(!buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('PNG signature');
  let p=8,w,h,type,depth,idat=[];
  while(p<buf.length){const len=buf.readUInt32BE(p),kind=buf.toString('ascii',p+4,p+8),data=buf.subarray(p+8,p+8+len);if(kind==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);depth=data[8];type=data[9];if(data[12]!==0)throw Error('Interlaced PNG unsupported')}if(kind==='IDAT')idat.push(data);p+=len+12;}
  if(depth!==8||![2,6].includes(type))throw Error(`Unexpected PNG layout ${depth}/${type}`);
  const channels=type===6?4:3,stride=w*channels,raw=inflateSync(Buffer.concat(idat)),pixels=Buffer.alloc(w*h*4),rows=Buffer.alloc(stride*h);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c};
  for(let y=0;y<h;y++){const filter=raw[y*(stride+1)];for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?rows[i-channels]:0,b=y?rows[i-stride]:0,c=y&&x>=channels?rows[i-stride-channels]:0,r=raw[y*(stride+1)+1+x];rows[i]=(r+(filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):NaN))&255;}for(let x=0;x<w;x++){let a=(y*w+x)*4,b=y*stride+x*channels;pixels[a]=rows[b];pixels[a+1]=rows[b+1];pixels[a+2]=rows[b+2];pixels[a+3]=channels===4?rows[b+3]:255}}
  return {width:w,height:h,colorType:type,pixels};
}
export function region(image,x0,y0,x1,y1){let visible=0,bright=0,sx=0,sy=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const p=(y*image.width+x)*4,a=image.pixels[p+3]/255;if(a>.094)visible++;const lum=(.2126*image.pixels[p]+.7152*image.pixels[p+1]+.0722*image.pixels[p+2])*a;if(lum>127.5){bright++;sx+=x;sy+=y}}
  return {visible,bright,centroid:bright?[sx/bright,sy/bright]:null};
}
