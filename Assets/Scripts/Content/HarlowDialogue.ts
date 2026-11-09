import {CaseGraph,VariantEntry} from "../Engine/core/Types";
import {performanceRef} from "../Engine/perf/ReferenceIds";

/** Reviewed performances of fixed accounts. A question supplies the murder-time context.
 * Directions are recording metadata, never spoken text or engine authority. */
export const HARLOW_DIALOGUE = [
  {"id":"C_S1_BACKGROUND","speaker":"S1","text":"Harlow lent me money for my father's shop. After that, every conversation seemed to come back to what I owed him.","direction":"[warmly]","background":"Imran borrowed money from Harlow to protect his father's shop."},
  {"id":"C_S2_BACKGROUND","speaker":"S2","text":"I managed the Harlow trust. Edmund supplied the name. I did the work. We did not always agree about what that was worth.","direction":"[dryly]","background":"Vale managed the Harlow charitable trust."},
  {"id":"C_S3_BACKGROUND","speaker":"S3","text":"I'm a doctor. Harlow knew me professionally. I'd rather you asked me a precise question than made a dramatic assumption.","direction":"[firmly]","background":"Dr. Okafor knew Harlow professionally."},
  {"id":"C_S4_BACKGROUND","speaker":"S4","text":"Jonah Pike. Art dealer. Harlow was a client. A very demanding client, as anyone who dealt with him could tell you.","direction":"[conversational]","background":"Jonah Pike was an art dealer who sold a miniature to Harlow."},
  {"id":"C_S1_ALIBI_0","speaker":"S1","text":"The lounge. Half past ten, yes. I know how this sounds, but that's where I was.","direction":"[hesitant]","alternate":"I was in the lounge when it happened. You don't have to like the answer, Detective."},
  {"id":"C_S1_ALIBI_1","speaker":"S1","text":"It was the hall. I took my debt note from Harlow's coat before half past ten. I was trying to get out from under that debt.","direction":"[sighs]"},
  {"id":"C_VALE_ALIBI_0","speaker":"S2","text":"Tea, Detective. I was making tea in the kitchen. Surely that isn't so difficult to believe.","direction":"[dryly]","alternate":"In the kitchen, making tea. Must an ordinary answer sound suspicious?","press":"The kettle was boiling. I stayed beside it. That is where I was at half past ten."},
  {"id":"C_VALE_ALIBI_1","speaker":"S2","text":"All right, I went into the study. But Edmund was already dead when I got there.","direction":"[defensively]","press":"Edmund never spoke after I entered the study. There was no answer from him."},
  {"id":"C_VALE_ALIBI_2","speaker":"S2","text":"Edmund and I were in the study. The cable was in my hands. I can't make that sound any better.","direction":"[sadly]","press":"The cable was in my hands, in the study. I have nothing to add to that."},
  {"id":"C_S3_ALIBI_0","speaker":"S3","text":"The conservatory. Half past ten, yes. That's my answer.","direction":"[firmly]","alternate":"At that hour I was in the conservatory. I'm being quite precise."},
  {"id":"C_S3_ALIBI_1","speaker":"S3","text":"Yes, the kitchen. I borrowed the medicine without logging it. That's what I was afraid you'd find.","direction":"[quietly]"},
  {"id":"C_S4_ALIBI_0","speaker":"S4","text":"At that hour? The hall. I don't see what's so remarkable about that.","direction":"[uneasy]","alternate":"I was in the hall when it happened. Is there some reason that troubles you?"},
  {"id":"C_S4_ALIBI_1","speaker":"S4","text":"The conservatory, then. I brought a forged certificate. There. You have the disgraceful part of my evening.","direction":"[ashamed]"},
  {"id":"C_OKAFOR_REPLY","speaker":"S3","text":"He answered her. Harlow answered Vale after she went into the study. I know what I heard.","direction":"[firmly]"},
  {"id":"C_PIKE_TRUST","speaker":"S4","text":"The trust accounts were forged. Harlow meant to expose Vale. Ask yourself what that meant for her.","direction":"[quietly]"},
  {"id":"C_SEES_S1","speaker":"S3","text":"Imran? In the hall when it happened. I saw him there.","direction":"[matter-of-fact]"},
  {"id":"C_SEES_S3","speaker":"S4","text":"The doctor was in the kitchen. Half past ten. I'm quite certain of that.","direction":"[conversational]"},
  {"id":"C_SEES_S4","speaker":"S1","text":"Pike was in the conservatory at half past ten. You'll have to ask him what he was doing.","direction":"[wryly]"},
  {"id":"C_SEES_O2","speaker":"S4","text":"Half past ten? The candlestick was still in the lounge. It certainly drew the eye.","direction":"[conversational]"},
  {"id":"C_SEES_O3","speaker":"S1","text":"The letter knife? Still in the hall when it happened. It's an odd thing to remember, but I do.","direction":"[thoughtful]"},
  {"id":"C_SEES_O4","speaker":"S3","text":"The medicine bottle was in the kitchen then. Please be precise about what you're suggesting.","direction":"[firmly]"},
  {"id":"C_SEES_O5","speaker":"S2","text":"The bookend was still in the conservatory. At half past ten, if you insist on the time.","direction":"[dryly]"}
];

export function addHarlowDialogue(graph:CaseGraph):void {
  const variants:VariantEntry[]=[];
  for(const row of HARLOW_DIALOGUE){
    if(row.background){const fact="F_"+row.speaker+"_BACKGROUND";
      graph.facts.push({id:fact,pred:"state",args:{who:row.speaker,prop:"background",value:row.background},canonical:row.background,entities:[row.speaker,"V"],truth:true});
      graph.statements.push({id:row.id,speaker:row.speaker,topic:"background",asserts:fact,stance:"truth",layer:0,canonical:row.text,entities:[row.speaker,"V"],breakers:[],costMinutes:0,pressed:{canonical:row.text,entities:[row.speaker,"V"]}});
    }
    const statement=graph.statements.find(s=>s.id===row.id&&s.speaker===row.speaker);if(!statement)throw Error("Missing authored dialogue account: "+row.id);
    for(const mode of ["answer","press"] as const){const lines=mode==="press"?[row.press||row.text]:[row.text,...(row.alternate?[row.alternate]:[])];
      lines.forEach((text,i)=>variants.push({id:"harlow-natural:"+row.id+":"+mode+":"+i,suspect:row.speaker,ref:performanceRef(mode==="press"?"p":"a",row.id),mode,text,emotion:statement.layer>0?"rattled":"guarded",authored:true}));
    }
  }
  graph.performances={variants:[...(graph.performances?.variants||[]),...variants],register:graph.performances?.register||[]};
}
