const fs=require('fs'),path=require('path');
if(!process.env.CLAD_SKILLS_DIR)throw Error('Set CLAD_SKILLS_DIR to the installed ls-clad skills folder.');
const m=require(path.resolve(process.env.CLAD_SKILLS_DIR,'build-music/tools'));
const PROJECT_ASSETS_SFX=path.resolve(__dirname,'../Assets/GeneratedSFX');
fs.mkdirSync(PROJECT_ASSETS_SFX,{recursive:true});
const genre='lofi-jazz',voice='piano';
const {chords,meta}=m.composeChords({genre,voice});
const bpm=m.suggestTempo(genre),bars=8,a=m.arrangement.arrangement8();
console.log(JSON.stringify({meta,bpm}));
const piano=m.chordEvents(chords,{voice,bars,velocity:55});
const bass=m.composeBass({chords,genre,bars});
const tracks=[
  m.track('piano',voice,m.mask(piano,a.full,bars,4),{fx:{hpf:220,lpf:2800,reverb:'mediumRoom',gain:0.45},humanize:{groove:'swing',swingAmount:0.13}}),
  m.track('bass','subBass',m.mask(bass,a.a,bars,4),{fx:{hpf:50,lpf:450,gain:0.3}})
];
const out=m.render(tracks,{bpm,master:{normalize:'peak',glue:true,width:1.1}});
m.WavBuilder.write(out,path.join(PROJECT_ASSETS_SFX,'BackgroundMusic.wav'));
