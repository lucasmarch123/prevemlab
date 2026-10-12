import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {registrationState,brasiliaDate} from '../campaign.mjs';
import gate from '../netlify/edge-functions/registration-window.js';

test('Brasília boundaries include all of 23:59 and ignore the host timezone',()=>{
  for(const [iso,state] of [['2026-10-13T02:59:59.999Z','before'],['2026-10-13T03:00:00Z','open'],['2026-10-24T02:59:59.999Z','open'],['2026-10-24T03:00:00Z','closed']])assert.equal(registrationState(Date.parse(iso)),state);
  assert.equal(brasiliaDate(new Date('2026-10-13T02:59:00Z')),'2026-10-12');
  assert.equal(brasiliaDate(new Date('2026-10-13T03:00:00Z')),'2026-10-13');
});
const valid={ 'form-name':'prevem-lab-inscricao',participante1:'TESTE FICTÍCIO',equipe:'TESTE',tipo:'Individual',titulo:'TESTE NÃO AVALIAR',problema:'Teste de problema',solucao:'Teste de solução',usoIA:'Teste de IA',impacto:'Teste de impacto',aplicacao:'Teste de aplicação',aceite:'on'};
function request(data=valid,path='/'){return new Request(`https://preview.invalid${path}`,{method:'POST',body:new URLSearchParams(data)});}
test('server gate blocks before and after period even with direct POST to alternative paths',async()=>{
 const real=Date.now;
 try{for(const now of ['2026-10-12T12:00:00Z','2026-10-24T03:00:00Z']){Date.now=()=>Date.parse(now);for(const path of ['/','/index.html','/inscricao-confirmada.html'])assert.equal((await gate(request(valid,path))).status,403);}}finally{Date.now=real;}
});
test('server gate preserves body, validates duo and allows in-period data downstream',async()=>{
 const real=Date.now;Date.now=()=>Date.parse('2026-10-15T12:00:00Z');
 try{
   const req=request();assert.equal(await gate(req),undefined);assert.match(await req.text(),/TESTE/);
   assert.equal((await gate(request({...valid,tipo:'Dupla'}))).status,400);
   assert.equal(await gate(request({...valid,tipo:'Dupla',participante2:'TESTE SEGUNDO'})),undefined);
   assert.equal((await gate(request({...valid,solucao:'   '}))).status,400);
   assert.equal((await gate(request({...valid,problema:'x'.repeat(3001)}))).status,400);
   assert.equal((await gate(request({...valid,aceite:''}))).status,400);
   assert.equal(await gate(new Request('https://preview.invalid/')),undefined);
 }finally{Date.now=real;}
});
test('all referenced assets match exact case; 12 slides; no public capacity wording',async()=>{
 const html=await readFile('index.html','utf8');const assets=await readdir('assets');
 for(const match of html.matchAll(/src="assets\/([^"]+)"/g))assert.ok(assets.includes(decodeURIComponent(match[1])),match[1]);
 assert.equal([...html.matchAll(/<section class="slide(?: active)?"/g)].length,12);
 assert.doesNotMatch(html,/vagas|apresentador|V4<\/title>|Inscrições e etapas serão comunicadas/i);
 const names=[...html.matchAll(/<(?:input|textarea|select)[^>]+name="([^"]+)"/g)].map(m=>m[1]);
 for(const name of [...Object.keys(valid),'participante2','data','bot-field'])assert.ok(names.includes(name),name);
});
