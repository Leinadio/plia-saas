// Usage: PLAYWRIGHT_PATH=/path/to/playwright node artifacts/plia-video/source/render.cjs
// Renders only this local composition. No browser session or bank data is used.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = __dirname;
const output = path.resolve(root, '..');
async function main() {
 const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403);res.end();return; }
  const types={'.html':'text/html','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');fs.createReadStream(file).pipe(res);
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const browser=await chromium.launch({headless:true});
 let encoder;
 try {
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  page.on('pageerror',error=>console.error('Page error:',error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/render.html`);
  const timeline=await page.evaluate(()=>window.ready);
  for(let i=0;i<timeline.scenes.length;i++){
   const s=timeline.scenes[i],time=s.start+(s.end-s.start)*.55;
   const frame=await page.evaluate(t=>window.draw(t),time);
   fs.writeFileSync(path.join(output,`scene-${i+1}.jpg`),Buffer.from(frame,'base64'));
  }
  if(process.argv.includes('--stills'))return;
  encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','30','-vcodec','mjpeg','-i','pipe:0','-i',path.join(output,'work/narration.wav'),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-b:a','192k','-t',String(timeline.duration),'-movflags','+faststart','-metadata','title=Plia — maquette de démonstration','-metadata','comment=Voix de synthèse provisoire. Présentateur non généré. Données fictives.',path.join(output,'plia-demo-maquette.mp4')],{stdio:['pipe','ignore','pipe']});
  let errors='';encoder.stderr.on('data',d=>errors+=d.toString());
  const completion=once(encoder,'close');
  const frames=Math.ceil(timeline.duration*30);
  for(let i=0;i<frames;i++){
   const jpg=await page.evaluate(t=>window.draw(t),Math.min(i/30,timeline.duration-.001));
   if(!encoder.stdin.write(Buffer.from(jpg,'base64')))await once(encoder.stdin,'drain');
   if(i%300===0)console.log(`Rendered ${i}/${frames} frames`);
  }
  encoder.stdin.end();const [code]=await completion;
  if(code!==0)throw new Error(errors);
  console.log(JSON.stringify({file:path.join(output,'plia-demo-maquette.mp4'),duration:timeline.duration,frames}));
 }finally{if(encoder && encoder.exitCode===null)encoder.kill();await browser.close();server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
