/** E8 design spike: never forward provider audio. Admit an engine-owned performance ID. */
export function approveAgentTurn(turn,engineSelection){
  if(!engineSelection||!Number.isInteger(engineSelection.seq)||!engineSelection.requestId||!engineSelection.performanceId||typeof engineSelection.text!=='string')return {ok:false,reason:'no_engine_selection'};
  if(!turn?.complete||turn.interrupted||turn.corrected)return {ok:false,reason:'incomplete_or_changed'};
  if(turn.seq!==engineSelection.seq||turn.requestId!==engineSelection.requestId)return {ok:false,reason:'stale_turn'};
  // Whitespace is formatting, not new words. No synonym/substring acceptance here.
  const normalize=s=>typeof s==='string'?s.trim().replace(/\s+/g,' '):null;
  if(normalize(turn.transcript)!==normalize(engineSelection.text))return {ok:false,reason:'unapproved_words'};
  return {ok:true,performanceId:engineSelection.performanceId};
}
