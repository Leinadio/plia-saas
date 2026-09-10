// A continuous recording of the original Plia demo components, with real clicks.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){
 const audio=JSON.parse(fs.readFileSync(path.join(__dirname,'audio-timing.json')));
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1440,height:810},colorScheme:'light',recordVideo:{dir:path.join(root,'work'),size:{width:1440,height:810}}});
 const page=await context.newPage();
 const video=page.video();
 const errors=[],writes=[];
 page.on('pageerror',error=>errors.push(error.message));
 // Rehearsed demo edit is local. Abort any unexpected application write.
 await page.route('**/*',async route=>{
  if(!['GET','HEAD'].includes(route.request().method())){writes.push(route.request().method()+' '+new URL(route.request().url()).pathname);await route.abort();}
  else await route.continue();
 });
 const timeline=[];
 try{
  await page.goto('https://localhost:3000/apercu-video',{waitUntil:'networkidle'});
  await page.addStyleTag({content:'nextjs-portal{display:none!important}*{cursor:none!important}'});
  await page.evaluate(()=>{
   const cursor=document.createElement('div');cursor.id='recording-cursor';
   cursor.style.cssText='position:fixed;top:0;left:0;z-index:2147483647;pointer-events:none;transform:translate(1280px,150px);width:32px;height:42px;filter:drop-shadow(0 2px 2px #0005)';
   cursor.innerHTML='<svg width="32" height="42" viewBox="0 0 32 42"><path d="M2 2V31L10 23L17 38L23 35L16 21H28Z" fill="#17222b" stroke="white" stroke-width="2.5" stroke-linejoin="round"/></svg>';
   document.body.append(cursor);
   document.addEventListener('mousemove',e=>{cursor.style.transform=`translate(${e.clientX-2}px,${e.clientY-2}px)`;},true);
   document.addEventListener('mousedown',e=>{
    const ring=document.createElement('div');ring.style.cssText=`position:fixed;left:${e.clientX-18}px;top:${e.clientY-18}px;width:36px;height:36px;border:2px solid #0b6e75;border-radius:50%;background:#0b6e7533;pointer-events:none;z-index:2147483646`;
    document.body.append(ring);const a=ring.animate([{transform:'scale(.5)',opacity:1},{transform:'scale(1.55)',opacity:0}],{duration:500,easing:'ease-out'});a.onfinish=()=>ring.remove();
   },true);
   const note=document.createElement('div');note.textContent='Voix générée par IA';note.style.cssText='position:fixed;bottom:10px;left:12px;z-index:2147483645;background:#ffffffec;border-radius:4px;padding:4px 7px;color:#526570;font:11px sans-serif;pointer-events:none';document.body.append(note);
   const marker=document.createElement('div');marker.id='recording-marker';marker.style.cssText='position:fixed;inset:0;background:#ff00ff;z-index:2147483647';document.body.append(marker);
  });
  await pause(550);
  await page.evaluate(()=>document.querySelector('#recording-marker').remove());
  const started=performance.now();
  let pointer={x:1280,y:150};
  const move=async(x,y,duration=700)=>{
   const from={...pointer},steps=Math.max(1,Math.round(duration/25));
   for(let i=1;i<=steps;i++){const v=i/steps,q=v<.5?4*v*v*v:1-((-2*v+2)**3)/2;await page.mouse.move(from.x+(x-from.x)*q,from.y+(y-from.y)*q);await pause(duration/steps);}
   pointer={x,y};
  };
  const point=async(locator,options={})=>{
   const b=await locator.boundingBox();assert.ok(b,'Target exists');
   const x=options.left?Math.max(42,b.x+16):b.x+b.width/2,y=b.y+b.height/2;
   assert.ok(x>=0&&x<=1440&&y>=0&&y<805,`Target is visible: ${x},${y}`);
   await move(x,y,options.duration||700);return {x,y};
  };
  const click=async(locator,options={})=>{await point(locator,options);await pause(120);await page.mouse.click(pointer.x,pointer.y);await pause(350);};
  const scroll=async(dy)=>{for(let i=0;i<20;i++){await page.mouse.wheel(0,dy/20);await pause(22);}await pause(180);};
  const course=()=>page.getByText('Courses',{exact:true}).first().locator('xpath=ancestor::td[1]');
  const expense=()=>page.locator('[data-onboarding-target="overview-expenses"] button');
  const income=()=>page.locator('[data-onboarding-target="overview-income"] button');
  const detailButton=()=>page.locator('[data-onboarding-target="open-amount-detail"] button');
  const transport=()=>page.locator('[data-onboarding-target="adjust-transport"] button');
  const close=()=>page.getByRole('button',{name:'Fermer',exact:true});
  const chapter=async(index,actions)=>{
   const start=(performance.now()-started)/1000;
   const record={...audio[index],start,audioStart:start+.25};timeline.push(record);
   await actions();
   const spent=(performance.now()-started)/1000-start;
   await pause(Math.max(0,(audio[index].duration+1.0-spent)*1000));
   record.end=(performance.now()-started)/1000;
   await page.screenshot({path:path.join(root,`etape-${index+1}.png`)});
   console.log(JSON.stringify({step:audio[index].id,start,end:record.end}));
  };
  await chapter(0,async()=>{
   await point(page.locator('[data-onboarding-target="overview-time"]'),{duration:1000});
   await move(866,390,600);
  });
  await chapter(1,async()=>{
   await point(income(),{left:true});await pause(800);await point(expense(),{left:true});
   await move(690,650);await scroll(360);
   await click(course(),{left:true});
   await pause(450);await move(220,590,650);
  });
  await chapter(2,async()=>{
   await click(detailButton());await close().waitFor();
   await move(1330,151,900);await pause(800);await move(1350,179,550);
   await pause(600);await move(1348,210,500);
  });
  await chapter(3,async()=>{
   // Close the detail and fold the purchases before adjusting another envelope.
   await click(close());await click(course(),{left:true});
   const b=await transport().boundingBox();
   if(b.y>690){await move(700,610);await scroll(b.y-530);}
   await click(transport());await page.getByRole('spinbutton').waitFor();
   await click(page.getByRole('spinbutton'));
   await page.keyboard.press('Meta+A');await page.keyboard.type('160',{delay:170});
   assert.equal(await page.getByRole('spinbutton').inputValue(),'160');
  });
  await chapter(4,async()=>{
   await click(page.getByRole('button',{name:'Appliquer',exact:true}));
   assert.match(await transport().innerText(),/160,00/);
   await pause(700);await click(close());
   const rest=page.locator('[data-cellkey="group:-20003::reste::1"] button').first();
   await point(rest);assert.match(await rest.innerText(),/12,40/);
  });
  await chapter(5,async()=>{
   // Collapse using the real product controls, leaving its totals visible.
   const incomeBox=await income().boundingBox();
   if(incomeBox.y<110){await move(700,300);await scroll(-420);}
   await click(income(),{left:true});await click(expense(),{left:true});
   await move(730,570);await scroll(-550);await scroll(180);
   // The original table scrolls horizontally to October and November.
   await move(1200,550);
   for(let i=0;i<36;i++){await page.mouse.wheel(38,0);await pause(30);}await pause(700);
   await move(1090,370,750);
   const future=page.locator('[data-cellkey="grand::soldePrevu::3"] button').first();
   const b=await future.boundingBox();
   if(b&&b.y<800&&b.x>340&&b.x<1380)await point(future);
  });
  await chapter(6,async()=>{
   const target=page.locator('[data-cellkey="grand::soldePrevu::3"] button').first();
   const b=await target.boundingBox();
   if(b&&b.x>340&&b.x<1380&&b.y<800)await point(target,{duration:1000});
   await pause(1300);await move(1380,760,950);
  });
  const duration=(performance.now()-started)/1000;
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  fs.writeFileSync(path.join(__dirname,'recording-timing.json'),JSON.stringify({duration,chapters:timeline,errors,writes},null,2));
 }finally{
  await context.close();await video.saveAs(path.join(root,'work/recording.webm'));await browser.close();
 }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
