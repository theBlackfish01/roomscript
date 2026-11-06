import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),relative='Engine/game/NarrativeAudio.ts',source=fs.readFileSync(path.join(root,'Assets/Scripts',relative),'utf8');
const before=`if(stage==="placed"){
      this.once({kind:"voice",key,speaker:"NARRATOR",text:"Listen at the door.",factIds:[]},out);
      for(const name of ["Rain","RoomTone"])this.once({kind:"ambience",key:key+name,name,enabled:true},out);
      this.once({kind:"score",key:key+":score",name:"MainTheme"},out);
    }`;
const after=`if(stage==="placed")this.once({kind:"voice",key,speaker:"NARRATOR",text:"Listen at the door.",factIds:[]},out);
    // Open background streams only after the player commits to opening the case.
    // Keep the knock/narrator prelude and every guarded dialogue unchanged.
    if(stage==="pull"){
      for(const name of ["Rain","RoomTone"])this.once({kind:"ambience",key:key+name,name,enabled:true},out);
      this.once({kind:"score",key:key+":score",name:"MainTheme"},out);
    }`;
const normalized=source.replaceAll('\r\n','\n');if(!normalized.includes(before))throw Error('Opening selector changed');
fs.writeFileSync(path.join(root,'Tooling/staging/NarrativeAudioOpeningBackground.ts'),normalized.replace(before,after));
fs.writeFileSync(path.join(root,'Tooling/staging/run7-opening-background-source.json'),JSON.stringify({relative,sha256:crypto.createHash('sha256').update(source).digest('hex')},null,2)+'\n');
console.log('Staged pull-triggered background audio proposal only; no Assets writes or tests run.');
