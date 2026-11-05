import test from 'node:test';import assert from 'node:assert/strict';
import {boundedAudioWindow} from './audio-window.mjs';
test('short provider overrun preserves full audio and bounds trailing reveal',()=>{
  const a={characters:['t','h','e'],starts:[.64,.68,.7],ends:[.68,.7,.8]};
  const r=boundedAudioWindow(a,.624);
  assert.equal(r.startSeconds,0);assert.equal(r.endSeconds,.624);assert.equal(r.alignmentBounded,true);
  assert.deepEqual(r.alignment.starts,[.624,.624,.624]);assert.deepEqual(a.ends,[.68,.7,.8]);
});
test('valid timestamps preserve measured intervals relative to trimmed start',()=>{
  const r=boundedAudioWindow({characters:['a'],starts:[.5],ends:[.8]},1);
  assert.equal(r.startSeconds,.44);assert.equal(r.endSeconds,.88);assert.equal(r.alignmentBounded,false);
  assert.ok(Math.abs(r.alignment.starts[0]-.06)<1e-9);
});
