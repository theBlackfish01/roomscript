/** Run 8 wearer UI: a question topic becomes one small glyph token (icon + one word).
 * Presentation only: it reads the already-presented topic and label, never a hidden fact.
 */
export type GlyphIcon="name"|"where"|"lie"|"ask"|"noted"|"object"|"person"|"clock"|"hunch"|"glove"|"witness"|"detail"|"more";
export interface GlyphToken {word:string;icon:GlyphIcon;}

const MAX_WORD=9;
function oneWord(text:string):string {
  const words=text.replace(/[^A-Za-z' -]/g," ").split(/\s+/).filter(Boolean);
  const word=words.length?words[words.length-1]:"Ask";
  const clean=word.charAt(0).toUpperCase()+word.slice(1);
  return clean.length>MAX_WORD?clean.slice(0,MAX_WORD-1)+".":clean;
}
/** topic and label come from presentedQuestions(); the label is already the player-facing wording. */
export function questionGlyph(topic:string,label:string):GlyphToken {
  if(topic==="free")return {word:"Ask",icon:"ask"};
  if(topic==="baseline:name")return {word:"Name",icon:"name"};
  if(topic==="whereabouts"||topic.startsWith("where@"))return {word:"Where",icon:"where"};
  if(topic.startsWith("about_"))return {word:oneWord(label),icon:"person"};
  if(topic==="victim")return {word:"Harlow",icon:"person"};
  if(topic.startsWith("motive"))return {word:"Motive",icon:"hunch"};
  if(topic==="visit")return {word:"Earlier",icon:"clock"};
  if(topic==="borrowed_item")return {word:"Touched",icon:"glove"};
  if(topic==="background")return {word:"Why here",icon:"ask"};
  if(topic.startsWith("weapon_"))return {word:oneWord(label),icon:"witness"};
  if(topic.startsWith("baseline:"))return {word:oneWord(topic.slice(9).replace(/_/g," ")),icon:"detail"};
  return {word:oneWord(label.replace(/^About\s+/i,"")),icon:"ask"};
}
/** Verbs after an answer. Object starts the physical "carry her words" objection. */
export function verbGlyph(verb:string):GlyphToken {
  switch(verb){
    case "Press":return {word:"Lying?",icon:"lie"};
    case "Object":return {word:"Object",icon:"object"};
    case "Believe":return {word:"Noted",icon:"noted"};
    case "Questions":return {word:"Ask",icon:"ask"};
    default:return {word:oneWord(verb),icon:"ask"};
  }
}
/** One short subtitle line: the newest words that fit, cut at a word boundary. */
export function subtitleWindow(text:string,maxChars=38):string {
  const flat=text.replace(/\s+/g," ").trim();if(flat.length<=maxChars)return flat;
  const words=flat.split(" ");let line="";
  for(let i=words.length-1;i>=0;i--){const next=line?words[i]+" "+line:words[i];if(next.length>maxChars-1)break;line=next;}
  return line?"…"+line:flat.slice(flat.length-maxChars+1);
}
