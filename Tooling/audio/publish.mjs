// Run only at an agreed Lens import checkpoint, never during LEAF.
import {cpSync,existsSync} from 'node:fs';import {resolve} from 'node:path';import {AUDIO,ROOT} from './lib.mjs';
const staged=resolve(AUDIO,'out/staged/Assets');if(!existsSync(staged))throw Error('NO_STAGED_AUDIO');cpSync(staged,resolve(ROOT,'Assets'),{recursive:true});console.log('Published staged audio batch; main agent must import and verify in Lens.');
