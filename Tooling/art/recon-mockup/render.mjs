import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright-core";

const root=path.dirname(fileURLToPath(import.meta.url));
const types={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".json":"application/json"};
const server=http.createServer((req,res)=>{const p=path.join(root,decodeURIComponent(req.url.split("?")[0]));
  if(!p.startsWith(root)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{"content-type":types[path.extname(p)]||"application/octet-stream"});fs.createReadStream(p).pipe(res);});
await new Promise(r=>server.listen(0,"127.0.0.1",r));const port=server.address().port;
const exe="C:/Users/wadoo/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe";
const browser=await chromium.launch({executablePath:exe,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
const frames=(process.argv[2]||"A,B,C,D,E").split(",");
for(const f of frames){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  page.on("console",m=>{if(m.type()==="error")console.log(f,"console:",m.text());});page.on("pageerror",e=>console.log(f,"pageerror:",e.message));
  await page.goto(`http://127.0.0.1:${port}/mockup.html?frame=${f}`);
  await page.waitForFunction(()=>window.__done===true,null,{timeout:120000});
  await page.evaluate(()=>{const d=document.createElement("div");d.style.cssText="position:fixed;left:0;right:0;bottom:0;padding:10px 18px;background:rgba(0,0,0,.62);color:#FFF0D6;font:600 18px Segoe UI;letter-spacing:.2px";d.textContent=window.__caption;document.body.appendChild(d);
    const b=document.createElement("div");b.style.cssText="position:fixed;right:14px;top:12px;padding:5px 10px;border:1px solid #E8B04A;color:#E8B04A;font:700 13px Consolas;background:rgba(0,0,0,.45)";b.textContent="DIRECTION MOCKUP · Three.js stand-in room · not a Lens capture";document.body.appendChild(b);});
  await page.screenshot({path:path.join(root,"frames",`recon-${f}.png`)});console.log("rendered",f);await page.close();
}
await browser.close();server.close();
