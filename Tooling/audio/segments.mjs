/** Runtime sentence aliases share their original MP3; no duplicated audio assets. */
export function castMismatches(clips,voices){
 const selected=new Map(voices.map(v=>[v.id,v.voiceId]));
 return clips.filter(c=>selected.has(c.speaker)&&c.voiceId!==selected.get(c.speaker)).map(c=>c.key);
}
export function prioritizeRuntimeSources(clips,runtimeLines){
 const keys=new Set(runtimeLines.map(l=>l.speaker+'|'+l.take+'|'+l.text));
 return clips.filter(c=>!c.derivedFrom).sort((a,b)=>Number(keys.has(b.key))-Number(keys.has(a.key)));
}
export function trimWindow(clip){
 const a=clip.alignment;if(!a?.starts?.length||!a.ends?.length)throw Error('MISSING_ALIGNMENT '+clip.key);
 return {from:Math.max(0,a.starts[0]-.06),until:a.ends.at(-1)+.08};
}
export function shiftAlignment(a,from){return {characters:[...a.characters],starts:a.starts.map(t=>Math.max(0,t-from)),ends:a.ends.map(t=>Math.max(0,t-from))};}
export function sentenceAlias(clip,source,window){
 const aligned=source.alignment.characters.join(''),start=aligned.indexOf(clip.text);
 if(start<0)throw Error('SENTENCE_NOT_IN_SOURCE '+clip.key);
 const last=start+clip.text.length-1,from=Math.max(window.from,source.alignment.starts[start]-.025),until=Math.min(window.until,source.alignment.ends[last]+.04);
 if(!(until>from))throw Error('EMPTY_SENTENCE '+clip.key);
 return {...clip,path:source.path,voiceId:source.voiceId,startSeconds:from-window.from,endSeconds:until-window.from,alignment:shiftAlignment({characters:source.alignment.characters.slice(start,last+1),starts:source.alignment.starts.slice(start,last+1),ends:source.alignment.ends.slice(start,last+1)},from)};
}
