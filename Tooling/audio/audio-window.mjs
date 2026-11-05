/** Provider alignments can overrun very short audio. Preserve audio and bound metadata. */
export function boundedAudioWindow(alignment,seconds){
  if(!(seconds>0)||!alignment?.starts?.length)throw Error('INVALID_AUDIO_WINDOW');
  const overrun=alignment.ends.at(-1)>seconds;
  const from=overrun?0:Math.max(0,alignment.starts[0]-.06);
  const until=Math.min(seconds,alignment.ends.at(-1)+.08);
  const cap=t=>Math.min(until-from,Math.max(0,t-from));
  return {startSeconds:from,endSeconds:until,alignmentBounded:overrun,alignment:{characters:[...alignment.characters],starts:alignment.starts.map(cap),ends:alignment.ends.map(cap)}};
}
