import {describe,expect,it} from "vitest";
import {SpeechArbiter,SpeechEvent} from "../../Assets/Scripts/Engine/perf/SpeechArbiter";
import {ConversationFocus,CONVERSATION_FOCUS,PREVIEW_CONVERSATION_FOCUS} from "../../Assets/Scripts/Engine/perf/ConversationFocus";

const deferred=()=>{let resolve!:(value:boolean)=>void;const promise=new Promise<boolean>(r=>resolve=r);return {promise,resolve};};

describe("Run 10 speech channel",()=>{
  it("finishes the current narrator, then chooses suspects before queued narration",async()=>{
    const events:SpeechEvent[]=[],arbiter=new SpeechArbiter(e=>events.push(e)),first=deferred(),second=deferred();
    const opening=arbiter.enqueue({id:"opening",role:"narrator",run:()=>first.promise});
    const observation=arbiter.enqueue({id:"item",role:"narrator",run:async()=>true});
    const answer=arbiter.enqueue({id:"answer",role:"suspect",run:()=>second.promise});
    expect(events.filter(e=>e.type==="start").map(e=>e.id)).toEqual(["opening"]);
    first.resolve(true);await opening;
    expect(events.filter(e=>e.type==="start").map(e=>e.id)).toEqual(["opening","answer"]);
    second.resolve(true);await Promise.all([answer,observation]);await arbiter.idle();
    expect(events.filter(e=>e.type==="start").map(e=>e.id)).toEqual(["opening","answer","item"]);
    let live=0;for(const e of events){if(e.type==="start")live++;if(e.type==="end")live--;expect(live).toBeLessThanOrEqual(1);expect(live).toBeGreaterThanOrEqual(0);}expect(live).toBe(0);
  });
  it("drops busy Wren and preserves FIFO for equal priority",async()=>{
    const events:SpeechEvent[]=[],arbiter=new SpeechArbiter(e=>events.push(e)),first=deferred();
    const a=arbiter.enqueue({id:"a",role:"suspect",run:()=>first.promise});
    const b=arbiter.enqueue({id:"b",role:"suspect",run:async()=>true});
    const c=arbiter.enqueue({id:"c",role:"suspect",run:async()=>true});
    expect(await arbiter.enqueue({id:"hint",role:"wren",run:async()=>{throw new Error("must not start");}})).toBe(false);
    first.resolve(true);await Promise.all([a,b,c]);
    expect(events.filter(e=>e.type==="start").map(e=>e.id)).toEqual(["a","b","c"]);
    expect(events.find(e=>e.id==="hint")?.reason).toBe("busy");
    expect(await arbiter.enqueue({id:"idle hint",role:"wren",run:async()=>true})).toBe(true);
  });
  it("cancels only at a case boundary and waits for native cleanup before the next line",async()=>{
    const events:SpeechEvent[]=[],arbiter=new SpeechArbiter(e=>events.push(e)),cleanup=deferred();let cancelled=false;
    const old=arbiter.enqueue({id:"old",role:"suspect",run:token=>{token.onCancel(()=>cancelled=true);return cleanup.promise;}});
    const queued=arbiter.enqueue({id:"stale",role:"narrator",run:async()=>{throw new Error("stale ran");}});
    arbiter.reset("case-change");expect(cancelled).toBe(true);expect(await queued).toBe(false);
    const fresh=arbiter.enqueue({id:"new",role:"narrator",run:async()=>true});
    let idle=false;const idleWait=arbiter.idle().then(()=>idle=true);
    expect(events.filter(e=>e.type==="start").map(e=>e.id)).toEqual(["old"]);expect(idle).toBe(false);
    cleanup.resolve(true);expect(await old).toBe(false);expect(await fresh).toBe(true);await idleWait;
    expect(events.find(e=>e.type==="end"&&e.id==="old")?.reason).toBe("case-change");expect(idle).toBe(true);
  });
  it("rechecks admission when dequeued and recovers after thrown playback and observer errors",async()=>{
    const arbiter=new SpeechArbiter(()=>{throw new Error("logger");}),first=deferred();let allowed=true;
    const active=arbiter.enqueue({id:"active",role:"suspect",run:()=>first.promise});
    const stale=arbiter.enqueue({id:"stale",role:"narrator",allowed:()=>allowed,run:async()=>{throw new Error("must not run");}});
    allowed=false;first.resolve(true);expect(await active).toBe(true);expect(await stale).toBe(false);
    expect(await arbiter.enqueue({id:"error",role:"suspect",run:async()=>{throw new Error("native");}})).toBe(false);
    expect(await arbiter.enqueue({id:"fallback",role:"narrator",run:async()=>false})).toBe(false);
    expect(await arbiter.enqueue({id:"next",role:"suspect",run:async()=>true})).toBe(true);
    await arbiter.idle();expect(arbiter.diagnostics().active).toBeNull();
  });
});

describe("Run 10 conversation focus",()=>{
  const person=(distanceCm=140,dot=1,id="S2")=>({id,distanceCm,dot});
  it("acquires the person looked at across the Preview room and tolerates moving toward their buttons",()=>{
    const focus=new ConversationFocus(PREVIEW_CONVERSATION_FOCUS),samples=[person(450,1),person(120,.8,"S1")];
    expect(focus.update(0,samples)).toBeNull();expect(focus.update(.15,samples)).toBe("S2");
    expect(focus.update(.3,[person(620,.4)])).toBe("S2");
    expect(focus.update(.5,[person(700,.2)])).toBe("S2");expect(focus.update(1.5,[person(700,.2)])).toBeNull();
  });
  it("requires continuous entry dwell and retains focus throughout distance/angle jitter",()=>{
    const focus=new ConversationFocus();expect(focus.update(0,[person()])).toBeNull();expect(focus.update(.2,[person()])).toBeNull();
    expect(focus.update(.25,[person(201)])).toBeNull();expect(focus.update(.3,[person()])).toBeNull();expect(focus.update(.59,[person()])).toBeNull();
    expect(focus.update(.6,[person()])).toBe("S2");
    for(let i=0;i<100;i++)expect(focus.update(1+i*.2,[person(i%2?205:250,i%2?.5:.8),person(100,1,"S1")])).toBe("S2");
  });
  it("requires continuous exit dwell, cancelling it when the player comes back",()=>{
    const focus=new ConversationFocus();focus.select("S2");
    expect(focus.update(0,[person(261)])).toBe("S2");expect(focus.update(.9,[person(261)])).toBe("S2");
    expect(focus.update(.95,[person(250)])).toBe("S2");expect(focus.update(1,[person(261)])).toBe("S2");expect(focus.update(1.99,[person(261)])).toBe("S2");expect(focus.update(2,[person(261)])).toBeNull();
  });
  it("uses angle and missing-target exit, exact inclusive thresholds, and reset",()=>{
    const focus=new ConversationFocus();const edge=person(200,CONVERSATION_FOCUS.enterDot);
    focus.update(0,[edge]);expect(focus.update(.3,[edge])).toBe("S2");
    expect(focus.update(.4,[person(260,CONVERSATION_FOCUS.leaveDot)])).toBe("S2");
    expect(focus.update(.5,[person(140,.3)])).toBe("S2");expect(focus.update(1.5,[])).toBeNull();
    focus.select("S1");focus.reset();expect(focus.diagnostics().current).toBeNull();
  });
});
