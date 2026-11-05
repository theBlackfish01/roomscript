/** Reversible publication hygiene; no git history rewrite or network access. */
import {readFileSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const raw=resolve(root,'devpost/clad-log-raw.md');if(!existsSync(raw))copyFileSync(resolve(root,'devpost/clad-log.md'),raw);
const story=resolve(root,'Assets/Scripts/Content/STORY.md'),text=readFileSync(story,'utf8');writeFileSync(story,text.replace(/\?s\b/g,"'s"));
const files=execFileSync('git',['ls-files','*.md'],{cwd:root,encoding:'utf8',timeout:30000}).trim().split('\n');
const deferred=[];let redacted=0;
for(const file of files){const path=resolve(root,file);if(!existsSync(path))continue;let source=readFileSync(path,'utf8');if(!/C:[\\/]+Users[\\/]/i.test(source))continue;if(['docs/PROGRESS.md','docs/decisions.md','devpost/clad-log.md','devpost/clad-log-raw.md'].includes(file)){deferred.push(file);continue;}
 const updated=source.replaceAll(root,'<project>').replaceAll(root.replaceAll('\\','/'),'<project>').replace(/C:[\\/]+Users[\\/][^`\r\n"<>]+/gi,'<local-development-path>');if(updated!==source){writeFileSync(path,updated);redacted++;}}
console.log(JSON.stringify({rawLogSha256:createHash('sha256').update(readFileSync(raw)).digest('hex'),storyRepairs:(text.match(/\?s\b/g)||[]).length,documentsRedacted:redacted,deferred},null,2));
