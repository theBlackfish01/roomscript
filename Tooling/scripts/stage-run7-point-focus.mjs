import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{createHash}from'node:crypto';
const folder='Tooling/staging/run7/point-focus/',path='Assets/Scripts/RoomscriptPointAccuseLeafScenario.ts';mkdirSync(folder,{recursive:true});const before=readFileSync(path,'utf8'),needle='expect(cast.accusationTargeting()).toBe(false);expect(targets("RoomscriptAccuse_S4").length).toBe(0);';if(!before.includes(needle))throw Error('Point gate changed');
const after=before.replace(needle,`await hand.ready;await hand.trigger(target("Question S2"));await sleep(200);
      expect(targets("Question 1").length).toBe(1);expect(targets("Believe").length).toBe(0);
      ${needle}`);
writeFileSync(folder+'RoomscriptPointAccuseLeafScenario.ts',after);writeFileSync(folder+'manifest.json',JSON.stringify({path,sourceSha256:createHash('sha256').update(before).digest('hex'),stagedSha256:createHash('sha256').update(after).digest('hex')},null,2));console.log('Staged strict IK focus acquisition; all existing assertions preserved');
