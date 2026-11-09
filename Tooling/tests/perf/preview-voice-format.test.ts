import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {createHash} from "node:crypto";

describe("bundled Preview voice encoding",()=>{
  it("ships every referenced MP3 in the verified 44.1 kHz stereo 128 kbps format",()=>{
    const root=resolve(".."),receipt=JSON.parse(readFileSync("audio/preview-voice-format.json","utf8"));
    const paths=new Set(["RoomscriptVoiceAssets.ts","RoomscriptRun7VoiceAssets.ts","RoomscriptRun10VoiceAssets.ts"].flatMap(name=>[...readFileSync(resolve(root,"Assets/Scripts",name),"utf8").matchAll(/requireAsset\("\.\.\/(Audio\/[^"\n]+\.mp3)"\)/g)].map(m=>"Assets/"+m[1])));
    expect(new Set(receipt.files.map((r:{path:string})=>r.path))).toEqual(paths);
    for(const row of receipt.files){
      const data=readFileSync(resolve(root,row.path));
      expect(createHash("sha256").update(data).digest("hex"),row.path).toBe(row.outputSha256);
      let offset=0;if(data.toString("ascii",0,3)==="ID3")offset=10+((data[6]&127)<<21)+((data[7]&127)<<14)+((data[8]&127)<<7)+(data[9]&127);
      // First MPEG frame: MPEG-1 Layer III, 128 kbps, 44.1 kHz, two channels.
      const header=data.readUInt32BE(offset);
      expect(header>>>21,row.path).toBe(0x7ff);
      expect((header>>>19)&3,row.path).toBe(3);
      expect((header>>>17)&3,row.path).toBe(1);
      expect((header>>>12)&15,row.path).toBe(9);
      expect((header>>>10)&3,row.path).toBe(0);
      expect((header>>>6)&3,row.path).not.toBe(3);
    }
  });
});
