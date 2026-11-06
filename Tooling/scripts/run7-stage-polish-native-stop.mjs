import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../..'),name='RoomscriptPolishLeafScenario.ts',source=fs.readFileSync(path.join(root,'Assets/Scripts',name),'utf8');
const before='audio.clock(false);audio.clock(false);const stopped=audio.loopDiagnostics();expect(stopped.clockStops).toBe(loopStart.clockStops+1);expect(stopped.clockPlaying).toBe(false);audio.clock(true,point);';
const after=`// Use the real non-ready scan phase so onState/PlayerMoved cannot reclaim clock ownership during the stop wait.
    opening.scanStatus("Clock handoff check");
    try{
      audio.clock(false);audio.clock(false);const stopRequested=audio.loopDiagnostics();
      console.log("POLISH_CLOCK_STOP_REQUEST|"+JSON.stringify({phase:opening.diagnostics().phase,state:stopRequested}));
      expect(opening.diagnostics().phase).toBe("scan");expect(stopRequested.clockStops).toBe(loopStart.clockStops+1);expect(stopRequested.clockStarts).toBe(loopStart.clockStarts);expect(stopRequested.clockActive).toBe(false);
      const stopStart=getTime(),stopDeadline=stopStart+2,stopWallDeadline=Date.now()+15000;let stopFrames=0;
      const stopSamples:{frame:number;seconds:number;playing:boolean;position:number;starts:number;stops:number}[]=[];
      while(audio.loopDiagnostics().clockPlaying&&getTime()<stopDeadline&&Date.now()<stopWallDeadline&&stopFrames<120){await nextFrame();stopFrames++;const state=audio.loopDiagnostics();if(stopSamples.length<12)stopSamples.push({frame:stopFrames,seconds:getTime()-stopStart,playing:state.clockPlaying,position:state.clockPosition,starts:state.clockStarts,stops:state.clockStops});}
      const stopped=audio.loopDiagnostics();console.log("POLISH_CLOCK_NATIVE_STOPPED|"+JSON.stringify({phase:opening.diagnostics().phase,frames:stopFrames,seconds:getTime()-stopStart,samples:stopSamples,state:stopped}));
      expect(stopped.clockStops).toBe(loopStart.clockStops+1);expect(stopped.clockStarts).toBe(loopStart.clockStarts);expect(stopped.clockActive).toBe(false);expect(stopped.clockPlaying).toBe(false);
    }finally{opening.finish();}`;
if(!source.includes(before))throw Error('Authoritative Polish stop block changed');
fs.writeFileSync(path.join(root,'Tooling/staging',name),source.replace(before,after));
fs.writeFileSync(path.join(root,'Tooling/staging/run7-polish-native-stop-source.json'),JSON.stringify({name,sha256:crypto.createHash('sha256').update(source).digest('hex')},null,2)+'\n');
console.log('Staged bounded native-stop observation using real scan phase; no Assets writes.');
