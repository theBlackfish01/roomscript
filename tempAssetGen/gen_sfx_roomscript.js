const fs=require('fs'),path=require('path');
const audio=require('C:/Users/wadoo/.codex/plugins/cache/ls-extensions/ls-clad/local/skills/build-sfx/tools');
const PROJECT_ASSETS_SFX='C:/Users/wadoo/Desktop/SPECS_Hackathon/RoomScriptF/Assets/GeneratedSFX';
fs.mkdirSync(PROJECT_ASSETS_SFX,{recursive:true});
const p=audio.sfx_presets;
const sounds={
  Knock:()=>p.impact({material:'wood',size:0.35}),
  TapeZip:()=>p.swish({duration:0.45,size:0.4,direction:'by'}),
  CrateThud:()=>p.impact({material:'wood',size:1.3}),
  ClockTick:()=>p.uiClick({character:'sharp',pitch:-5}),
  Tink:()=>p.impact({material:'glass',size:0.2}),
  Shing:()=>p.swish({duration:0.65,size:0.8,direction:'up'}),
  Objection:()=>p.impact({material:'metal',size:1.6}),
  Ratchet:()=>p.uiToggle({on:true,pitch:-9}),
  Chime:()=>p.uiNotify(),
  ChalkScratch:()=>audio.mix_bus.applyFx(p.swish({duration:0.55,size:0.25}),{hpf:1800,lpf:6000,gain:0.6})
};
for(const [name,render] of Object.entries(sounds)) {
  const buffer=render(); audio.mix_bus.masterChain(buffer,{normalize:'peak'});
  audio.WavBuilder.write(buffer,path.join(PROJECT_ASSETS_SFX,name+'.wav'));
}
