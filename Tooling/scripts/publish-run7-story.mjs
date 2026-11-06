/** Execute only on main's explicit Assets release. LeafIndex remains main-owned. */
import{readFileSync,writeFileSync,existsSync}from'node:fs';import{createHash}from'node:crypto';
const folder='Tooling/staging/run7/story/',row=JSON.parse(readFileSync(folder+'main-integration.json','utf8')),hash=s=>createHash('sha256').update(s).digest('hex');
const before=readFileSync(row.path,'utf8'),main=readFileSync(folder+'RoomscriptMain.ts','utf8');if(hash(before)!==row.sourceSha256||hash(main)!==row.stagedSha256)throw Error('Main changed: rebase before publication');
const files=[
 ['Assets/Scripts/Engine/game/StoryMomentPlan.ts',readFileSync(folder+'StoryMomentPlan.ts','utf8').replace('../../../../Assets/Scripts/Engine/core/Types','../core/Types').replace('../../../../Assets/Scripts/Engine/game/NarrativeAudio','./NarrativeAudio')],
 ['Assets/Scripts/RoomscriptStoryMoments.ts',readFileSync(folder+'RoomscriptStoryMoments.ts','utf8')],
 ['Assets/Scripts/RoomscriptStoryMomentsLeafScenario.ts',readFileSync(folder+'RoomscriptStoryMomentsLeafScenario.ts','utf8')],
 ['Tooling/tests/game/story-moment-plan.test.ts',readFileSync(folder+'story-moment-plan.test.ts','utf8').replace('./StoryMomentPlan','../../../Assets/Scripts/Engine/game/StoryMomentPlan').replaceAll('../../../../Assets','../../../Assets')]
];for(const[path]of files)if(existsSync(path))throw Error('Refuse overwrite of existing new file: '+path);
for(const[path,text]of files)writeFileSync(path,text);writeFileSync(row.path,main);console.log(JSON.stringify({published:files.map(([p])=>p).concat(row.path),leafIndex:'main must register',status:'Assets hold resumed'}));
