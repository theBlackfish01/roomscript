import {normalizedWords} from "./Gazetteer";
const stems:Record<string,string>={preparing:"making",prepared:"making",arrived:"entered",reached:"entered",went:"entered",spoke:"speak",speaking:"speak",responded:"answer",respond:"answer",answered:"answer",answering:"answer",stole:"take",took:"take",held:"handle",handled:"handle",holding:"handle",stayed:"was",stood:"was",remained:"was",meant:"intended",wanted:"intended"};
// Normalize bounded grammatical equivalents before checking participants. Movement
// requires an inward/destination preposition; "walked away from" must not match.
// Negators are never removed, and perfect-aspect death retains its named subject.
const tokens=(text:string)=>normalizedWords(text)
  .replace(/\bmy name is\b/g,"i am")
  .replace(/\b(?:walked|came|gone) (?:into|in|to)\b/g,"entered")
  .replace(/\bhad (already )?died\b/g,"was $1dead")
  .replace(/\b([a-z]+) was answered by ([a-z]+)\b/g,"$2 answer $1")
  .replace(/\brespond(?:ed|ing)? to\b/g,"answer").match(/[a-z]+/g)?.map(w=>stems[w]||w)||[];
const verbs=new Set("heard answer entered speak take borrowed handle met intended was am is are carries brought found reached stayed".split(" "));
/** Local role and negated-verb constraints; intentionally not semantic entailment. */
export function preservesRoles(canonical:string,performance:string):boolean {
  const a=tokens(canonical),b=tokens(performance);
  const hasPair=(first:string,second:string)=>b.some((w,i)=>w===first&&b[i+1]===second);
  for(let i=0;i<a.length-1;i++){
    const w=a[i],next=a[i+1];
    if(["not","never","no","without"].includes(w)&&!hasPair(w,next))return false;
    if(["my","his","her","their","our"].includes(w)&&!hasPair(w,next))return false;
    if(verbs.has(next)&&!verbs.has(w)&&!new Set(["the","a","an","not","never","no","already","was","i"]).has(w)&&!hasPair(w,next))return false;
    if(w==="i"&&verbs.has(next)&&!hasPair(w,next))return false;
  }
  for(const pronoun of ["my","his","her","their","our"])if(b.includes(pronoun)&&!a.includes(pronoun))return false;
  return true;
}
