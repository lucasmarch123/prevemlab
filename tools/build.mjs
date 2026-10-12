import {mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const output=resolve(root,'dist');
if(output!==resolve(root,'dist'))throw new Error('Invalid output path');
await mkdir(output,{recursive:true});
// Copy only browser assets; tests, reports and server code stay outside publish.
for(const name of ['index.html','inscricao-confirmada.html','campaign.css','campaign.mjs','app.js','particles.js'])await copyFile(resolve(root,name),resolve(output,name));
await mkdir(resolve(output,'assets'),{recursive:true});
for(const name of ['prevem_lab_previa_60s_4k (1).mp4','abertura.mp3','prevem_lab_iveco_daily_bau_4k.mp4','premiacao.png','2026-10-09 recording suno-com 3.mp3'])await copyFile(resolve(root,'assets',name),resolve(output,'assets',name));
console.log('Versão de revisão preparada em dist/ (sem publicação).');
