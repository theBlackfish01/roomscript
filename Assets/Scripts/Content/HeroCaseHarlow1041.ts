import {CaseGraph, Evidence, Fact, RoomObject, RoomScan, Statement, Suspect} from "../Engine/core/Types";
import {hashHex} from "../Engine/core/Hash";
import {canonicalJson} from "../Engine/core/CanonicalJson";

/** Authored truth for the first complete case. Narrative never changes these facts. */
const zones: RoomScan["zones"] = [
  {id:"Z1", label:"desk", clueName:"Study", anchor:[80,0,-180]},
  {id:"Z2", label:"bed", clueName:"Lounge", anchor:[-160,0,-120]},
  {id:"Z3", label:"door", clueName:"Hall", anchor:[170,0,40]},
  {id:"Z4", label:"kettle corner", clueName:"Kitchen", anchor:[180,0,-250]},
  {id:"Z5", label:"window", clueName:"Conservatory", anchor:[-120,0,-280]}
];
const objects: RoomObject[] = [
  {id:"O1",label:"charger cable",type:"cord",zone:"Z1",pos:[95,75.5,-190],affordances:["weapon:strangle"],origin:"fixture",synonyms:["cable","cord","charger"]},
  {id:"O2",label:"brass candlestick",type:"blunt",zone:"Z2",pos:[-130,62,-90],affordances:["weapon:blunt"],origin:"substitution",virtual:true,synonyms:["candlestick"]},
  {id:"O3",label:"letter knife",type:"sharp",zone:"Z3",pos:[150,80,20],affordances:["weapon:sharp"],origin:"substitution",virtual:true,synonyms:["knife","letter opener"]},
  {id:"O4",label:"medicine bottle",type:"poison",zone:"Z4",pos:[190,98,-250],affordances:["weapon:poison"],origin:"fixture",synonyms:["bottle","medicine","poison"]},
  {id:"O5",label:"marble bookend",type:"heavy",zone:"Z5",pos:[-120,90,-270],affordances:["weapon:heavy"],origin:"substitution",virtual:true,synonyms:["bookend","paperweight"]},
  {id:"O6",label:"desk lamp",type:"light",zone:"Z1",pos:[110,109,-210],affordances:["witness:sight","witness:presence"],origin:"fixture",synonyms:["lamp"]},
  {id:"O7",label:"evidence clock",type:"clock",zone:"Z3",pos:[170,145,40],affordances:["witness:time"],origin:"substitution",virtual:true,synonyms:["clock"]},
  {id:"O8",label:"door latch",type:"door",zone:"Z3",pos:[190,110,70],affordances:["witness:passage"],origin:"fixture",synonyms:["door","latch"]},
  {id:"O9",label:"chipped mug",type:"cup",zone:"Z1",pos:[65,84,-180],affordances:["witness:state"],origin:"fixture",synonyms:["mug","cup"]},
  {id:"O10",label:"window glass",type:"mirror",zone:"Z5",pos:[-120,125,-280],affordances:["witness:reflection"],origin:"fixture",synonyms:["window","glass","reflection"]},
  {id:"O11",label:"kettle",type:"kettle",zone:"Z4",pos:[175,96,-265],affordances:["witness:state"],origin:"fixture",synonyms:["tea kettle"]},
  {id:"O12",label:"dictation recorder",type:"screen",zone:"Z1",pos:[65,79,-200],affordances:["witness:record"],origin:"substitution",virtual:true,synonyms:["recorder","recording","screen"]},
  {id:"O13",label:"bed cover",type:"soft",zone:"Z2",pos:[-160,47,-120],affordances:["hiding:soft"],origin:"fixture",synonyms:["bed","cover"]}
];
const room: RoomScan = {
  schema:1, roomId:"r_"+hashHex(canonicalJson(objects.map(o=>[o.type,zones.findIndex(z=>z.id===o.zone)]).sort())),
  source:"fixture", zones, objects
};

const suspects: Suspect[] = [
  {id:"S1",name:"Imran Qadir",nicknames:["Imran","Qadir"],persona:"A charming debtor whose jokes stop when someone mentions his father's shop.",voice:"ash",actingNotes:"Warm, quick, defensive only about money.",tell:"flicker",tellProp:"lighter",composureMax:4,secret:"Stole his signed debt note from Harlow's Hall coat pocket to protect his father's shop.",relations:[{to:"S2",type:"debtor"},{to:"S3",type:"ally"},{to:"S4",type:"rival"}],traits:["gossip"],baseline:{truthTopic:"baseline:name",lieTopic:"baseline:lighter"}},
  {id:"S2",name:"Marguerite Vale",nicknames:["Marguerite","Vale","Mrs. Vale"],persona:"An immaculate trustee who treats every question as a breach of etiquette.",voice:"coral",actingNotes:"Controlled, precise; let the politeness sharpen under pressure.",tell:"gaze_snap",tellProp:"brooch",composureMax:4,secret:"Forged the Harlow charitable trust accounts; Edmund planned to give the originals to the police.",relations:[{to:"S1",type:"employer"},{to:"S3",type:"rival"},{to:"S4",type:"ally"}],baseline:{truthTopic:"baseline:name",lieTopic:"baseline:brooch"}},
  {id:"S3",name:"Dr. Ada Okafor",nicknames:["Ada","Okafor","Dr. Okafor"],persona:"A physician protecting her sister's dignity, impatient with theatrical accusations.",voice:"sage",actingNotes:"Measured and dry; grief surfaces only in brief pauses.",tell:"ring_spike",tellProp:"glasses glare",composureMax:5,secret:"Borrowed medicine without logging it to treat her uninsured sister; Harlow threatened to report her.",relations:[{to:"S1",type:"ally"},{to:"S2",type:"rival"},{to:"S4",type:"stranger"}],baseline:{truthTopic:"baseline:name",lieTopic:"baseline:glasses"}},
  {id:"S4",name:"Jonah Pike",nicknames:["Jonah","Pike"],persona:"A brittle art dealer rehearsing sophistication while looking for the nearest exit.",voice:"echo",actingNotes:"Clipped, polished, with a nervous rush at the ends of sentences.",tell:"hesitation",tellProp:"glove tug",composureMax:3,secret:"Forged the provenance of a miniature he sold to Harlow; came to switch the certificate.",relations:[{to:"S1",type:"rival"},{to:"S2",type:"ally"},{to:"S3",type:"stranger"}],baseline:{truthTopic:"baseline:name",lieTopic:"baseline:gloves"}}
];

const facts: Fact[] = [];
const addFact = (id:string,pred:Fact["pred"],args:Fact["args"],canonical:string,entities:string[],slot?:number,truth=true,suspicious=false):string => {
  const fact:Fact={id,pred,args,canonical,entities,truth};
  if(slot!==undefined) fact.slot=slot;
  if(suspicious) fact.suspicious=true;
  facts.push(fact); return id;
};

addFact("F_VICTIM_STUDY_LAMP","at",{who:"V",zone:"Z1"},"Harlow stood in the Study at 22:30.",["V","Z1","22:30"],6);
addFact("F_VICTIM_STUDY_MUG","at",{who:"V",zone:"Z1"},"Harlow knocked the mug from the Study desk at 22:30.",["V","Z1","O9","22:30"],6);
addFact("F_VALE_STUDY","at",{who:"S2",zone:"Z1"},"Vale stood in the Study at 22:30.",["S2","Z1","22:30"],6);
addFact("F_VALE_CABLE","touched",{who:"S2",obj:"O1"},"Vale handled the cable at 22:30.",["S2","O1","22:30"],6);
addFact("F_CABLE_CONTACT","state",{obj:"O1",prop:"contact",value:"Harlow"},"The cable carries Harlow's collar fibres.",["O1","V"],6);
addFact("F_KETTLE_COLD","state",{obj:"O11",prop:"temperature",value:"cold"},"The kettle stayed cold during the murder window.",["O11"],6);
addFact("F_REPLY_AFTER_ARRIVAL","before",{first:"Vale_arrival",second:"Harlow_death"},"Harlow answered Vale after she entered the Study.",["V","S2","Z1"],6);
addFact("F_RECORDER_ORDER","before",{first:"Vale_arrival",second:"Harlow_death"},"The recorder captured Harlow answering Vale after her arrival.",["O12","V","S2"],6);
addFact("F_VALE_MOTIVE","motive",{who:"S2",victim:"V",kind:"forgery_exposure"},"Harlow intended to expose Vale's forged trust accounts.",["S2","V"],5);
addFact("F_BODY_MOVED","state",{who:"V",prop:"body_moved",value:"desk_to_floor"},"The body was moved from the Study chair to the floor before it was found.",["V","Z1"],6);
addFact("F_BODY_FOUND","state",{who:"V",prop:"found_at",value:"22:41"},"Harlow's body was found at 22:41.",["V","22:41"],6);
addFact("X_VALE_KITCHEN","at",{who:"S2",zone:"Z4"},"Vale was in the Kitchen at 22:30.",["S2","Z4","22:30"],6,false);
addFact("X_KETTLE_BOILING","state",{obj:"O11",prop:"temperature",value:"boiling"},"The kettle was boiling during the murder window.",["O11"],6,false);
addFact("X_DEAD_BEFORE_ARRIVAL","before",{first:"Harlow_death",second:"Vale_arrival"},"Harlow died before Vale arrived.",["V","S2"],6,false);

const alibis = [
  {id:"S1",zone:"Z3",wrong:"Z2",holder:"O8",observer:"S3",name:"Imran",place:"Hall",wrongPlace:"Lounge",secret:"debt_note_stolen",secretText:"Imran stole his debt note before the murder."},
  {id:"S3",zone:"Z4",wrong:"Z5",holder:"O11",observer:"S4",name:"Okafor",place:"Kitchen",wrongPlace:"Conservatory",secret:"medicine_borrowed",secretText:"Okafor borrowed medicine without logging it."},
  {id:"S4",zone:"Z5",wrong:"Z3",holder:"O10",observer:"S1",name:"Pike",place:"Conservatory",wrongPlace:"Hall",secret:"certificate_forged",secretText:"Pike brought a forged certificate."}
];
for(const a of alibis) {
  addFact("F_"+a.id+"_ALIBI_OBJECT","at",{who:a.id,zone:a.zone},a.name+" stayed in the "+a.place+" at 22:30.",[a.id,a.zone,"22:30"],6);
  addFact("F_"+a.id+"_ALIBI_WITNESS","at",{who:a.id,zone:a.zone},a.name+" was seen in the "+a.place+" at 22:30.",[a.id,a.zone,"22:30"],6);
  addFact("X_"+a.id+"_ALIBI","at",{who:a.id,zone:a.wrong},a.name+" stayed in the "+a.wrongPlace+" at 22:30.",[a.id,a.wrong,"22:30"],6,false);
  addFact("F_"+a.id+"_SECRET","state",{who:a.id,prop:"secret",value:a.secret},a.secretText,[a.id],4,true,true);
}
const weaponLocations = [
  {id:"O2",zone:"Z2",observer:"S4",name:"candlestick",place:"Lounge"},
  {id:"O3",zone:"Z3",observer:"S1",name:"letter knife",place:"Hall"},
  {id:"O4",zone:"Z4",observer:"S3",name:"medicine bottle",place:"Kitchen"},
  {id:"O5",zone:"Z5",observer:"S2",name:"bookend",place:"Conservatory"}
];
for(const w of weaponLocations) {
  addFact("F_"+w.id+"_LOCATION_OBJECT","in",{obj:w.id,zone:w.zone},"The "+w.name+" remained in the "+w.place+" at 22:30.",[w.id,w.zone,"22:30"],6);
  addFact("F_"+w.id+"_LOCATION_WITNESS","in",{obj:w.id,zone:w.zone},"The "+w.name+" was seen in the "+w.place+" at 22:30.",[w.id,w.zone,"22:30"],6);
}
const baselines = [
  {speaker:"S1",topic:"baseline:lighter",prop:"lighter",falseValue:"empty",trueValue:"fuelled",holder:"O8",lie:"My lighter is empty.",truth:"My lighter is fuelled.",observed:"The door remembers Imran's lighter catching a flame."},
  {speaker:"S2",topic:"baseline:brooch",prop:"brooch_clasp",falseValue:"fastened",trueValue:"open",holder:"O6",lie:"My brooch is fastened.",truth:"My brooch clasp is open.",observed:"The lamp catches the open clasp on Vale's brooch."},
  {speaker:"S3",topic:"baseline:glasses",prop:"glasses",falseValue:"spotless",trueValue:"smudged",holder:"O11",lie:"These glasses are spotless.",truth:"My glasses are smudged.",observed:"The kettle reflects a smudge across Okafor's glasses."},
  {speaker:"S4",topic:"baseline:gloves",prop:"gloves",falseValue:"dry",trueValue:"wet",holder:"O10",lie:"Both my gloves are dry.",truth:"My gloves are wet.",observed:"The window remembers water dripping from Pike's gloves."}
];
for(const b of baselines) {
  addFact("F_"+b.speaker+"_NAME","state",{who:b.speaker,prop:"identity",value:suspects.find(s=>s.id===b.speaker)!.name},suspects.find(s=>s.id===b.speaker)!.name,[b.speaker]);
  addFact("X_"+b.speaker+"_BASELINE","state",{who:b.speaker,prop:b.prop,value:b.falseValue},b.lie,[b.speaker],undefined,false);
  addFact("F_"+b.speaker+"_BASELINE","state",{who:b.speaker,prop:b.prop,value:b.trueValue},b.truth,[b.speaker]);
}

const evidence: Evidence[] = [
  {id:"E_VICTIM_LAMP",holder:"O6",kind:"object_memory",proves:["F_VICTIM_STUDY_LAMP"],canonical:"The lamp remembers Harlow standing in the Study at 22:30.",entities:["O6","V","Z1","22:30"],costMinutes:10},
  {id:"E_VICTIM_MUG",holder:"O9",kind:"object_memory",proves:["F_VICTIM_STUDY_MUG"],canonical:"The mug remembers Harlow's sleeve knocking it from the Study desk at 22:30.",entities:["O9","V","Z1","22:30"],costMinutes:10},
  {id:"E_VALE_LAMP",holder:"O6",kind:"object_memory",proves:["F_VALE_STUDY"],canonical:"The lamp remembers Vale beside the Study desk at 22:30.",entities:["O6","S2","Z1","22:30"],costMinutes:10},
  {id:"E_KETTLE_COLD",holder:"O11",kind:"object_memory",proves:["F_KETTLE_COLD"],canonical:"The kettle remembers no heat during the murder window. There was no boiling tea.",entities:["O11"],costMinutes:10},
  {id:"E_CABLE",holder:"O1",kind:"object_memory",proves:["F_VALE_CABLE","F_CABLE_CONTACT"],canonical:"The cable remembers Vale's hands. Harlow's collar fibres remain caught in it.",entities:["O1","S2","V"],costMinutes:10},
  {id:"E_RECORDING",holder:"O12",kind:"object_memory",proves:["F_RECORDER_ORDER"],canonical:"The recorder preserves Harlow answering Vale after she entered. He was alive when she arrived.",entities:["O12","V","S2"],costMinutes:10},
  {id:"E_CLOCK_FOUND",holder:"O7",kind:"object_memory",proves:["F_BODY_FOUND"],canonical:"The clock remembers the alarm raised at 22:41.",entities:["O7","22:41"],costMinutes:10},
  {id:"E_TRUST_NOTE",holder:"O13",kind:"object_memory",proves:["F_VALE_MOTIVE"],canonical:"A carbon impression in the bed cover reads: Harlow will expose Vale's forged trust accounts.",entities:["O13","V","S2"],costMinutes:10},
  {id:"E_LETTER",holder:"Z2",kind:"letter",proves:["F_VALE_MOTIVE"],canonical:"Harlow's sealed letter names Vale's forged trust accounts and his intended report to the police.",entities:["V","S2"],latent:true,beat:"B_LETTER",costMinutes:0},
  {id:"E_VOICEMAIL",holder:"O12",kind:"voicemail",proves:["F_REPLY_AFTER_ARRIVAL"],canonical:"A delayed voicemail preserves Harlow answering Vale in the Study.",entities:["O12","V","S2","Z1"],latent:true,beat:"B_VOICEMAIL",costMinutes:0},
  {id:"E_UV_DRAG",holder:"Z1",kind:"photo",proves:["F_BODY_MOVED"],canonical:"The UV trace shows Harlow was moved from the Study chair to the floor.",entities:["V","Z1"],latent:true,beat:"B_BLACKOUT",costMinutes:0}
];
for(const a of alibis) evidence.push({id:"E_"+a.id+"_ALIBI",holder:a.holder,kind:"object_memory",proves:["F_"+a.id+"_ALIBI_OBJECT"],canonical:a.name+" remained in the "+a.place+" at 22:30.",entities:[a.id,a.zone,"22:30"],costMinutes:10});
for(const w of weaponLocations) evidence.push({id:"E_"+w.id+"_LOCATION",holder:w.id,kind:"object_memory",proves:["F_"+w.id+"_LOCATION_OBJECT"],canonical:"The "+w.name+" remembers remaining in the "+w.place+" at 22:30.",entities:[w.id,w.zone,"22:30"],costMinutes:10});
for(const b of baselines) evidence.push({id:"E_"+b.speaker+"_BASELINE",holder:b.holder,kind:"object_memory",proves:["F_"+b.speaker+"_BASELINE"],canonical:b.observed,entities:[b.speaker,b.holder],costMinutes:10});
evidence.push({id:"E_S2_BASELINE_MUG",holder:"O9",kind:"object_memory",proves:["F_S2_BASELINE"],canonical:"The mug remembers Vale leaning close: the brooch clasp hung open.",entities:["O9","S2"],costMinutes:10});

const statements: Statement[] = [
  {id:"C_VALE_ALIBI_0",speaker:"S2",topic:"where@22:30",asserts:["X_VALE_KITCHEN","X_KETTLE_BOILING"],stance:"cover",layer:0,canonical:"I was in the Kitchen making tea at 22:30.",entities:["S2","Z4","O11","22:30"],about:"O11",breakers:[["E_KETTLE_COLD"],["E_VALE_LAMP"]],onBreak:"C_VALE_ALIBI_1",pressed:{canonical:"The kettle was boiling. I stayed beside it at 22:30.",entities:["O11","Z4","22:30"]},costMinutes:15},
  {id:"C_VALE_ALIBI_1",speaker:"S2",topic:"where@22:30",asserts:["F_VALE_STUDY","X_DEAD_BEFORE_ARRIVAL"],stance:"cover",layer:1,canonical:"I reached the Study at 22:30. Harlow was already dead.",entities:["S2","Z1","V","22:30"],about:"O12",breakers:[["E_RECORDING"],["E_VOICEMAIL"],["C_OKAFOR_REPLY"]],onBreak:"C_VALE_ALIBI_2",pressed:{canonical:"Harlow never spoke after I entered the Study.",entities:["V","S2","Z1"]},costMinutes:15},
  {id:"C_VALE_ALIBI_2",speaker:"S2",topic:"where@22:30",asserts:["F_VALE_STUDY","F_VALE_CABLE"],stance:"truth",layer:2,canonical:"I met Harlow in the Study at 22:30. The cable was in my hands.",entities:["S2","V","Z1","O1","22:30"],about:"O1",breakers:[],pressed:{canonical:"The cable was in my hands in the Study. That is my account.",entities:["S2","O1","Z1"]},costMinutes:15},
  {id:"C_OKAFOR_REPLY",speaker:"S3",topic:"about:V",asserts:"F_REPLY_AFTER_ARRIVAL",stance:"truth",layer:0,canonical:"I heard Harlow answer Vale after she entered the Study.",entities:["S3","V","S2","Z1"],breakers:[],costMinutes:15},
  {id:"C_PIKE_TRUST",speaker:"S4",topic:"motive:S2",asserts:"F_VALE_MOTIVE",stance:"truth",layer:0,canonical:"Harlow intended to expose Vale's forged trust accounts.",entities:["S4","V","S2"],breakers:[],costMinutes:15}
];
for(const a of alibis) {
  const secretLines:Record<string,string>={S1:"I was in the Hall at 22:30. I stole my debt note before that.",S3:"I was in the Kitchen at 22:30. I had borrowed medicine without logging it.",S4:"I was in the Conservatory at 22:30. I brought a forged certificate."};
  statements.push(
    {id:"C_"+a.id+"_ALIBI_0",speaker:a.id,topic:"where@22:30",asserts:"X_"+a.id+"_ALIBI",stance:"cover",layer:0,canonical:"I was in the "+a.wrongPlace+" at 22:30.",entities:[a.id,a.wrong,"22:30"],about:a.holder,breakers:[["E_"+a.id+"_ALIBI"],["C_SEES_"+a.id]],onBreak:"C_"+a.id+"_ALIBI_1",costMinutes:15},
    {id:"C_"+a.id+"_ALIBI_1",speaker:a.id,topic:"where@22:30",asserts:["F_"+a.id+"_ALIBI_OBJECT","F_"+a.id+"_SECRET"],stance:"truth",layer:1,canonical:secretLines[a.id],entities:[a.id,a.zone,"22:30",...(a.id==="S3"?["O4"]:[])],about:a.holder,breakers:[],costMinutes:15},
    {id:"C_SEES_"+a.id,speaker:a.observer,topic:"about:"+a.id,asserts:"F_"+a.id+"_ALIBI_WITNESS",stance:"truth",layer:0,canonical:"I saw "+a.name+" in the "+a.place+" at 22:30.",entities:[a.observer,a.id,a.zone,"22:30"],breakers:[],costMinutes:15}
  );
}
for(const w of weaponLocations) statements.push({id:"C_SEES_"+w.id,speaker:w.observer,topic:"about:"+w.id,asserts:"F_"+w.id+"_LOCATION_WITNESS",stance:"truth",layer:0,canonical:"The "+w.name+" stayed in the "+w.place+" at 22:30.",entities:[w.observer,w.id,w.zone,"22:30"],breakers:[],costMinutes:15});
for(const b of baselines) {
  const s=suspects.find(item=>item.id===b.speaker)!;
  statements.push(
    {id:"C_"+b.speaker+"_NAME",speaker:b.speaker,topic:"baseline:name",asserts:"F_"+b.speaker+"_NAME",stance:"truth",layer:0,canonical:"My name is "+s.name+".",entities:[s.id],breakers:[],costMinutes:15},
    {id:"C_"+b.speaker+"_BASELINE_LIE",speaker:b.speaker,topic:b.topic,asserts:"X_"+b.speaker+"_BASELINE",stance:"cover",layer:0,canonical:b.lie,entities:[s.id],about:b.holder,breakers:b.speaker==="S2"?[["E_S2_BASELINE"],["E_S2_BASELINE_MUG"]]:[["E_"+b.speaker+"_BASELINE"]],onBreak:"C_"+b.speaker+"_BASELINE_TRUE",costMinutes:15},
    {id:"C_"+b.speaker+"_BASELINE_TRUE",speaker:b.speaker,topic:b.topic,asserts:"F_"+b.speaker+"_BASELINE",stance:"truth",layer:0,canonical:b.truth,entities:[s.id],breakers:[],replacementFor:"C_"+b.speaker+"_BASELINE_LIE",costMinutes:15}
  );
}

// Repeating the bounded account is a valid pressure response; it never invents a fact.
for(const statement of statements) if(!statement.pressed) statement.pressed={canonical:statement.canonical,entities:statement.entities.slice()};

const base: CaseGraph = {
  schema:1,caseId:"HARLOW-1041@"+room.roomId,seed:1041,pitchHash:hashHex("HARLOW-1041-authored-v1"),compilerVersion:"roomscript-0.1.0",era:"1940s_noir",
  room,slots:["21:00","21:15","21:30","21:45","22:00","22:15","22:30","22:45","23:00","23:15","23:30","23:45"],murderSlot:6,bodyFound:"22:41",
  envelope:{who:"S2",where:"Z1",what:"O1"},cast:{victim:{id:"V",name:"Edmund Harlow"},suspects},weapons:["O1","O2","O3","O4","O5"],facts,
  witnessing:evidence.filter(e=>e.kind==="object_memory").flatMap(e=>e.proves.map(fact=>({witness:e.holder,fact,channel:"record" as const}))),
  evidence,statements,
  refutation:{order:["O8","S1","O6","S3","O11","S4","O10","S2","O9","O2","O3","O4","O5"],cards:{
    O8:[{eliminates:"S1",via:"F_S1_ALIBI_OBJECT"}],
    S1:[{eliminates:"S4",via:"F_S4_ALIBI_WITNESS"},{eliminates:"O3",via:"F_O3_LOCATION_WITNESS"}],
    O6:[{eliminates:"Z2",via:"F_VICTIM_STUDY_LAMP"},{eliminates:"Z3",via:"F_VICTIM_STUDY_LAMP"},{eliminates:"Z4",via:"F_VICTIM_STUDY_LAMP"},{eliminates:"Z5",via:"F_VICTIM_STUDY_LAMP"}],
    S3:[{eliminates:"S1",via:"F_S1_ALIBI_WITNESS"},{eliminates:"O4",via:"F_O4_LOCATION_WITNESS"}],
    O11:[{eliminates:"S3",via:"F_S3_ALIBI_OBJECT"}],
    S4:[{eliminates:"S3",via:"F_S3_ALIBI_WITNESS"},{eliminates:"O2",via:"F_O2_LOCATION_WITNESS"}],
    O10:[{eliminates:"S4",via:"F_S4_ALIBI_OBJECT"}],S2:[{eliminates:"O5",via:"F_O5_LOCATION_WITNESS"}],
    O9:[{eliminates:"Z2",via:"F_VICTIM_STUDY_MUG"},{eliminates:"Z3",via:"F_VICTIM_STUDY_MUG"},{eliminates:"Z4",via:"F_VICTIM_STUDY_MUG"},{eliminates:"Z5",via:"F_VICTIM_STUDY_MUG"}],
    O2:[{eliminates:"O2",via:"F_O2_LOCATION_OBJECT"}],O3:[{eliminates:"O3",via:"F_O3_LOCATION_OBJECT"}],O4:[{eliminates:"O4",via:"F_O4_LOCATION_OBJECT"}],O5:[{eliminates:"O5",via:"F_O5_LOCATION_OBJECT"}]
  }},
  beats:[
    {id:"B_LETTER",type:"latent_letter",reveals:["E_LETTER"],minute:45,guaranteed:true,validated:true,canonical:"A sealed letter slides from beneath the bed cover."},
    {id:"B_VOICEMAIL",type:"voicemail",reveals:["E_VOICEMAIL"],minute:75,guaranteed:true,validated:true,canonical:"Harlow's delayed voicemail lights the recorder."},
    {id:"B_FLIGHT",type:"suspect_wants_to_leave",reveals:[],minute:105,guaranteed:true,validated:true,pressureMinutes:0,canonical:"Pike reaches for the door. The forensic tape holds him here."},
    {id:"B_BLACKOUT",type:"blackout",reveals:["E_UV_DRAG"],minute:120,guaranteed:true,validated:true,canonical:"Added light fades. The UV trace reveals the body was moved."}
  ],
  requiredDeductions:[
    {id:"D_OPPORTUNITY",type:"opportunity",subject:"S2",supports:[["E_VALE_LAMP"],["C_VALE_ALIBI_2"]],canonical:"Vale was in the Study during the murder window."},
    {id:"D_MEANS",type:"means",subject:"S2",supports:[["E_CABLE"],["C_VALE_ALIBI_2"]],canonical:"Vale handled the cable during the murder window."},
    {id:"D_ALIBI",type:"alibi_broken",subject:"S2",supports:[["E_KETTLE_COLD"],["E_VALE_LAMP"]],canonical:"Vale's tea alibi is false."},
    {id:"D_MOTIVE",type:"motive",subject:"S2",supports:[["E_TRUST_NOTE"],["C_PIKE_TRUST"],["E_LETTER"]],canonical:"Harlow was about to expose Vale's forged trust accounts."}
  ],clockMinutes:180
};

/** Fresh mutable copy for independent sessions, compiler fixtures and broken-variant tests. */
export function createHeroCase(): CaseGraph {return JSON.parse(JSON.stringify(base)) as CaseGraph;}
export const heroCase: CaseGraph = createHeroCase();
