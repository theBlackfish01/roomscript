import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),name='RoomscriptPolishLeafScenario.ts',source=fs.readFileSync(path.join(root,'Assets/Scripts',name),'utf8');let out=source;
const before=`const loopStart=audio.loopDiagnostics();expect(loopStart.clockStarts).toBe(loopBefore.clockStarts+1);
    for(let i=0;i<12;i++){audio.clock(true,point);audio.score(loopStart.scoreName);}
    const loopRepeated=audio.loopDiagnostics();expect(loopRepeated.clockStarts).toBe(loopStart.clockStarts);expect(loopRepeated.scoreStarts).toBe(loopStart.scoreStarts);expect(loopRepeated.clockPlaying).toBe(true);
    const loopUntil=getTime()+1.15;for(let i=0;i<120&&getTime()<loopUntil;i++)await nextFrame();
    expect(getTime()>=loopUntil).toBe(true);const loopAfter=audio.loopDiagnostics();expect(loopAfter.clockStarts).toBe(loopStart.clockStarts);expect(loopAfter.clockPlaying).toBe(true);`;
const after=`const loopStart=audio.loopDiagnostics();console.log("POLISH_CLOCK_START|"+JSON.stringify({before:loopBefore,start:loopStart}));expect(loopStart.clockStarts).toBe(loopBefore.clockStarts+1);
    // Native play can become active on the next engine frame. A start counter is not playback proof.
    const nativeStart=getTime(),nativeDeadline=nativeStart+2,nativeWallDeadline=Date.now()+15000;let nativeFrames=0;
    const startSamples:{frame:number;seconds:number;playing:boolean;position:number;starts:number}[]=[];
    while(!audio.loopDiagnostics().clockPlaying&&getTime()<nativeDeadline&&Date.now()<nativeWallDeadline&&nativeFrames<120){await nextFrame();nativeFrames++;const state=audio.loopDiagnostics();if(startSamples.length<12)startSamples.push({frame:nativeFrames,seconds:getTime()-nativeStart,playing:state.clockPlaying,position:state.clockPosition,starts:state.clockStarts});}
    const nativeReady=audio.loopDiagnostics();console.log("POLISH_CLOCK_NATIVE_READY|"+JSON.stringify({frames:nativeFrames,seconds:getTime()-nativeStart,samples:startSamples,state:nativeReady}));
    expect(nativeReady.clockStarts).toBe(loopStart.clockStarts);expect(nativeReady.clockPlaying).toBe(true);
    for(let i=0;i<12;i++){audio.clock(true,point);audio.score(loopStart.scoreName);}
    const loopRepeated=audio.loopDiagnostics();console.log("POLISH_CLOCK_REPEATED|"+JSON.stringify({start:loopStart,repeated:loopRepeated}));expect(loopRepeated.clockStarts).toBe(loopStart.clockStarts);expect(loopRepeated.scoreStarts).toBe(loopStart.scoreStarts);expect(loopRepeated.clockPlaying).toBe(true);
    const loopUntil=getTime()+1.15;for(let i=0;i<120&&getTime()<loopUntil;i++)await nextFrame();
    const loopAfter=audio.loopDiagnostics();console.log("POLISH_CLOCK_AFTER_PERIOD|"+JSON.stringify({deadline:loopUntil,now:getTime(),state:loopAfter}));expect(getTime()>=loopUntil).toBe(true);expect(loopAfter.clockStarts).toBe(loopStart.clockStarts);expect(loopAfter.clockPlaying).toBe(true);`;
if(!out.includes(before))throw Error('Authoritative Polish changed');out=out.replace(before,after);fs.writeFileSync(path.join(root,'Tooling/staging',name),out);
fs.writeFileSync(path.join(root,'Tooling/staging/run7-polish-native-start-source.json'),JSON.stringify({name,sha256:crypto.createHash('sha256').update(source).digest('hex')}));console.log('Staged bounded native-start wait; no Assets writes.');
