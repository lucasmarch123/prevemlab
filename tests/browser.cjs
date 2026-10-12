const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const base='http://127.0.0.1:8878';
(async()=>{
 await fs.mkdir('review',{recursive:true});
 const server=await require('../tools/preview.cjs').start(8878);
 const browser=await chromium.launch({headless:true,executablePath:process.env.TEST_CHROMIUM});
 const errors=[];let checks=0;
 async function pageAt(width=1366,height=768,date='2026-10-15T12:00:00Z'){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  page.on('pageerror',error=>errors.push(error.message));
  await page.clock.setFixedTime(new Date(date));await page.goto(base);return page;
 }
 try{
 for(const [width,height] of [[1366,768],[1920,1080],[390,844]]){
  const p=await pageAt(width,height);
  await p.screenshot({path:`review/entrada-${width}.png`});
  await p.locator('#entrySignup').click();
  assert.ok(await p.locator('#inscricao').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.top<80;}));
  assert.ok(await p.locator('#backgroundMusic').evaluate(e=>e.paused));
  await p.locator('[name=participante1]').fill('TESTE FICTÍCIO LOCAL');
  await p.locator('#signupRules').click();await p.locator('#centralSignup').click();
  assert.equal(await p.locator('[name=participante1]').inputValue(),'TESTE FICTÍCIO LOCAL');
  await p.locator('#problema').fill('Teste sem interferência das setas');await p.locator('#problema').press('ArrowRight');
  assert.equal(await p.locator('#counter').textContent(),'01 / 12');
  await p.locator('#signupRules').click();
  await p.locator('#discoverPrize').click();await p.locator('#skipPrize').click();
  await p.screenshot({path:`review/premio-${width}.png`});
  assert.ok(await p.locator('#reveal').evaluate(e=>e.scrollWidth<=e.clientWidth));
  if(width>=1366) assert.ok(await p.locator('#continue').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));
  assert.ok(await p.locator('#prizeArt').evaluate(e=>e.naturalWidth>0));
  await p.locator('#replayPrize').click();assert.ok(await p.locator('#rewardFilm').isVisible());
  await p.locator('#skipPrize').click();await p.locator('#continue').click();
  assert.ok(await p.locator('#explore').isVisible());
  await p.locator('#backDeck').click();
  await p.locator('#quickSignup').click();assert.equal(await p.locator('[name=participante1]').inputValue(),'TESTE FICTÍCIO LOCAL');
  await p.locator('#backDeck').click();
  for(let i=1;i<12;i++){await p.locator('#next').click();assert.equal(await p.locator('#counter').textContent(),`${String(i+1).padStart(2,'0')} / 12`);}
  await p.locator('#hubSignup').click();await p.screenshot({path:`review/formulario-${width}.png`});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  checks++;await p.close();
 }
 const p=await pageAt();await p.locator('#entrySignup').click();
 let calls=0, posted, respond;let mode='delay';
 await p.route(base+'/',async route=>{
  if(route.request().method()!=='POST')return route.continue();calls++;posted=new URLSearchParams(route.request().postData());
  if(mode==='delay')await new Promise(resolve=>respond=resolve);
  await route.fulfill({status:mode==='success'?200:500,body:mode==='success'?'OK':'TEST ERROR'});
 });
 await p.locator('#confirmSignup').click();assert.equal(calls,0);
 for(const name of ['participante1','equipe','titulo','problema','solucao','usoIA','impacto','aplicacao'])await p.locator(`[name=${name}]`).fill(`TESTE FICTÍCIO ${name}`);
 await p.locator('[name=aceite]').check();await p.locator('#participacaoTipo').selectOption('Dupla');
 await p.locator('#confirmSignup').click();assert.equal(calls,0);
 await p.locator('[name=participante2]').fill('TESTE FICTÍCIO SEGUNDO');
 await p.locator('#confirmSignup').click();await p.waitForFunction(()=>document.querySelector('#confirmSignup').textContent==='Enviando…');
 assert.ok(await p.locator('#confirmSignup').isDisabled());
 await p.locator('#ideaForm').evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 assert.equal(calls,1);respond();await p.waitForFunction(()=>document.querySelector('#formFeedback').textContent.includes('Não foi possível'));
 assert.equal(await p.locator('[name=participante2]').inputValue(),'TESTE FICTÍCIO SEGUNDO');
 assert.equal(posted.get('participante2'),'TESTE FICTÍCIO SEGUNDO');
 assert.equal(posted.get('data'),'2026-10-15');assert.equal(posted.get('form-name'),'prevem-lab-inscricao');
 await p.locator('#participacaoTipo').selectOption('Individual');mode='success';
 await p.locator('#confirmSignup').click();await p.waitForURL('**/inscricao-confirmada.html');
 assert.equal(posted.get('participante2'),'');assert.match(await p.locator('main').innerText(),/não significa aprovação/);checks++;await p.close();
 for(const [date,expected] of [['2026-10-13T02:59:59Z','Inscrições a partir'],['2026-10-13T03:00:00Z','Enviar minha ideia'],['2026-10-24T02:59:59Z','Enviar minha ideia'],['2026-10-24T03:00:00Z','Inscrições encerradas']]){
  const p=await pageAt(1366,768,date);await p.locator('#entrySignup').click();assert.match(await p.locator('#confirmSignup').textContent(),new RegExp(expected));assert.equal(await p.locator('#confirmSignup').isDisabled(),expected!=='Enviar minha ideia');checks++;await p.close();
 }
 const deep=await pageAt();await deep.goto(base+'/#inscricao');assert.ok(await deep.locator('#inscricao').evaluate(e=>e.getBoundingClientRect().top<80));await deep.close();
 const av=await pageAt();await av.locator('#startExperience').click();await av.waitForFunction(()=>document.querySelector('#introVideo').currentTime>0);await av.locator('#skipIntro').click();
 for(let i=0;i<9;i++)await av.locator('#next').click();assert.ok(await av.locator('#next').isDisabled());
 await av.locator('#unlock').click();await av.waitForFunction(()=>document.querySelector('#prizeVideo').currentTime>0);await av.locator('#skipPrize').click();await av.locator('#continue').click();assert.equal(await av.locator('#counter').textContent(),'11 / 12');await av.close();checks++;
 const review=await pageAt(1366,768,'2026-10-09T22:00:00Z');await review.screenshot({path:'review/entrada-revisao.png'});await review.close();
 assert.deepEqual(errors,[]);
 console.log(`PASS: ${checks} browser scenarios; no JS errors. Screenshots in review/. POST success/error are local mocks, not Netlify receipt.`);
 }finally{await browser.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
