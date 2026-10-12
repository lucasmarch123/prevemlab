import {registrationState, stateMessages, brasiliaDate, validateSubmission} from './campaign.mjs';

const $ = id => document.getElementById(id);
const slides = [...document.querySelectorAll('.slide')];
const footer = document.querySelector('.footer');
const surfaces = [$('introGate'),$('introFilm'),$('deck'),footer,$('explore'),$('rewardFilm'),$('reveal')];
let screen = 'entry', index = 0, unlocked = false, prizeReturn = 'deck';
let returnFocus = null, prizeFocus = null, prizeScroll = 0;
let soundEnabled = true, volume = .24, experienceStarted = false;
let introTimer, prizeTimer;
const bg = $('backgroundMusic'), introVideo = $('introVideo'), opening = $('openingTrack'), prizeVideo = $('prizeVideo');

function showScreen(next, focusTarget) {
  screen = next;
  $('introGate').classList.toggle('hidden', next !== 'entry');
  $('introFilm').classList.toggle('show', next === 'intro');
  $('explore').classList.toggle('visible', next === 'rules');
  $('rewardFilm').classList.toggle('show', next === 'prizeFilm');
  $('reveal').classList.toggle('show', next === 'prize');
  const active = next === 'deck' ? [$('deck'), footer] : [{entry:$('introGate'),intro:$('introFilm'),rules:$('explore'),prizeFilm:$('rewardFilm'),prize:$('reveal')}[next]];
  for (const surface of surfaces) {
    surface.inert = !active.includes(surface);
    surface.setAttribute('aria-hidden', String(surface.inert));
  }
  $('mode').setAttribute('aria-expanded', String(next === 'rules'));
  $('explore').classList.toggle('unlocked', unlocked);
  focusTarget?.focus({preventScroll:true});
}
function setSlide(next, focus = false) {
  if (next < 0 || next >= slides.length || (index === 9 && !unlocked && next > 9)) return;
  index = next;
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
    slide.inert = i !== index;
    slide.setAttribute('aria-hidden', String(i !== index));
    if (i === index) slide.scrollTop = 0;
  });
  $('prev').disabled = index === 0;
  $('next').disabled = index === slides.length - 1 || (index === 9 && !unlocked);
  $('counter').textContent = `${String(index + 1).padStart(2,'0')} / ${slides.length}`;
  $('progress').style.width = `${(index+1)/slides.length*100}%`;
  if (focus) { slides[index].tabIndex = -1; slides[index].focus({preventScroll:true}); }
}
function showRules(signup = false) {
  if (screen !== 'rules') returnFocus = document.activeElement;
  clearTimeout(introTimer); introVideo.pause(); opening.pause();
  showScreen('rules');
  $('explore').scrollTop = signup ? $('inscricao').offsetTop - 24 : 0;
  (signup ? $('inscricao') : $('backDeck')).focus({preventScroll:true});
}
function backDeck() {
  showScreen('deck');
  if (returnFocus && footer.contains(returnFocus)) returnFocus.focus();
  else setSlide(index, true);
  playBackground();
}
$('entrySignup').onclick = $('quickSignup').onclick = $('hubSignup').onclick = $('centralSignup').onclick = () => showRules(true);
$('entryRules').onclick = $('mode').onclick = $('hubRules').onclick = $('exploreFromEnd').onclick = $('signupRules').onclick = () => showRules();
$('backDeck').onclick = $('backBottom').onclick = backDeck;
$('prev').onclick = () => setSlide(index-1,true);
$('next').onclick = () => setSlide(index+1,true);
$('hubHome').onclick = () => setSlide(0,true);

function syncSound() {
  bg.volume = volume; opening.volume = Math.min(1, volume*2); prizeVideo.volume = Math.min(1,volume*2);
  for (const media of [bg,opening,prizeVideo]) media.muted = !soundEnabled;
  introVideo.muted = true;
  $('musicVolume').value = Math.round(volume*100);
  $('volumeValue').textContent = `${Math.round(volume*100)}%`;
  const audible = soundEnabled && experienceStarted;
  const text = audible ? '♫ Silenciar' : '♫ Ativar som';
  for (const button of [$('musicMute'),...document.querySelectorAll('.media-mute')]) {
    button.textContent = text;
    button.setAttribute('aria-label',audible ? 'Silenciar todo o áudio' : 'Ativar áudio');
    button.setAttribute('aria-pressed',String(!audible));
  }
}
function playBackground() {
  if (!experienceStarted || !soundEnabled || !['deck','rules'].includes(screen)) return;
  bg.play().catch(() => { $('musicMute').textContent = '▶ Ativar som'; });
}
function toggleSound() {
  // A user entering via the form can enable music explicitly.
  if (!experienceStarted) { experienceStarted=true; soundEnabled=true; }
  else soundEnabled=!soundEnabled;
  if (soundEnabled && volume===0) volume=.24;
  syncSound();
  if (soundEnabled) playBackground();
}
$('musicMute').onclick=toggleSound;
$('musicVolume').oninput=event=>{volume=Number(event.target.value)/100;soundEnabled=volume>0;experienceStarted=true;syncSound();playBackground();};
for (const parent of [$('introFilm'),$('rewardFilm')]) {
  const button=document.createElement('button');button.className='btn media-mute';button.onclick=toggleSound;parent.append(button);
}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen?.();}catch{}}
$('fullscreen').onclick=$('introFullscreen').onclick=fullscreen;
function introEnd(){clearTimeout(introTimer);introVideo.pause();opening.pause();$('introTitle').classList.add('show');$('enterDeck').focus();}
function enterDeck(){clearTimeout(introTimer);introVideo.pause();opening.pause();showScreen('deck');setSlide(index,true);playBackground();}
$('startExperience').onclick=()=>{
  experienceStarted=true;bg.pause();$('introTitle').classList.remove('show');
  showScreen('intro',$('skipIntro'));introVideo.currentTime=0;opening.currentTime=0;syncSound();
  introTimer=setTimeout(introEnd,65000);
  // Both play calls occur during the original user gesture.
  introVideo.play().catch(introEnd);opening.play().catch(()=>{});
};
introVideo.addEventListener('ended',introEnd);introVideo.addEventListener('error',()=>{if(screen==='intro')introEnd();});
$('skipIntro').onclick=$('enterDeck').onclick=enterDeck;

function beginPrize(){
  if (!['prize','prizeFilm'].includes(screen)) {prizeReturn=screen;prizeFocus=document.activeElement;prizeScroll=$('explore').scrollTop;}
  unlocked=true;experienceStarted=true;setSlide(index);bg.pause();
  showScreen('prizeFilm',$('skipPrize'));prizeVideo.currentTime=0;syncSound();
  clearTimeout(prizeTimer);prizeTimer=setTimeout(finishPrize,65000);
  prizeVideo.play().catch(finishPrize);
}
function finishPrize(){if(screen!=='prizeFilm')return;clearTimeout(prizeTimer);prizeVideo.pause();showScreen('prize',$('continue'));}
function leavePrize(){
  clearTimeout(prizeTimer);prizeVideo.pause();
  if(prizeReturn==='rules'){showScreen('rules',prizeFocus);$('explore').scrollTop=prizeScroll;}
  else {showScreen('deck');setSlide(index===9?10:index,true);}
  playBackground();
}
$('unlock').onclick=$('hubReward').onclick=$('discoverPrize').onclick=beginPrize;
$('skipPrize').onclick=finishPrize;
$('continue').onclick=leavePrize;
const prizeActions=document.createElement('div');prizeActions.className='cta-row';
$('continue').before(prizeActions);prizeActions.append($('continue'));
const replay=document.createElement('button');replay.className='btn';replay.textContent='↺ Rever o vídeo';replay.id='replayPrize';replay.onclick=beginPrize;prizeActions.append(replay);
$('prizeArt').addEventListener('load',()=>{$('prizeArtFallback').hidden=true;});
$('prizeArt').addEventListener('error',()=>{$('prizeArtFallback').hidden=false;});
$('prizeArtFallback').hidden=$('prizeArt').complete&&$('prizeArt').naturalWidth>0;

document.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.altKey||event.metaKey)return;
  if(event.key==='Escape'){
    if(screen==='rules')backDeck();else if(screen==='intro')enterDeck();else if(screen==='prizeFilm')finishPrize();else if(screen==='prize')leavePrize();
    return;
  }
  if(screen!=='deck'||event.target.closest('input,textarea,select,a,summary,[contenteditable]')||(event.key===' '&&event.target.closest('button')))return;
  if(['ArrowRight',' ','PageDown'].includes(event.key)){event.preventDefault();setSlide(index+1,true);}
  if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();setSlide(index-1,true);}
  if(event.key.toLowerCase()==='f')fullscreen();
  if(event.key.toLowerCase()==='m')toggleSound();
});

const form=$('ideaForm'), submit=$('confirmSignup'), feedback=$('formFeedback');
let submitting=false;
function updatePeriod(){
  const state=registrationState();
  document.querySelectorAll('.campaign-status').forEach(node=>{if(node.textContent!==stateMessages[state])node.textContent=stateMessages[state];});
  submit.disabled=submitting||state!=='open';
  submit.textContent=submitting?'Enviando…':state==='before'?'Inscrições a partir de 13/10':state==='closed'?'Inscrições encerradas':'Enviar minha ideia';
  $('inscricaoData').value=brasiliaDate();
  return state;
}
function updatePartner(){const duo=$('participacaoTipo').value==='Dupla';$('partnerField').hidden=!duo;const field=form.elements.participante2;field.required=duo;field.disabled=!duo;}
$('participacaoTipo').onchange=updatePartner;
for(const field of form.querySelectorAll('textarea')){
  field.addEventListener('input',()=>{$(`${field.name}Count`).textContent=`${field.value.length} / ${field.maxLength} caracteres`;field.setCustomValidity('');});
}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(submitting)return;
  if(updatePeriod()!=='open'){feedback.textContent=stateMessages[registrationState()];return;}
  if(!form.reportValidity())return;
  const data=new FormData(form);
  if(data.get('tipo')==='Individual')data.set('participante2','');
  const validation=validateSubmission(data);
  if(validation){feedback.textContent=validation;return;}
  submitting=true;updatePeriod();form.setAttribute('aria-busy','true');feedback.textContent='Enviando… Aguarde a confirmação de recebimento.';
  try{
    const response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(data).toString(),signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error(response.status===403?'period':'service');
    window.location.assign(form.getAttribute('action'));
  }catch(error){
    feedback.textContent=error.message==='period'?'O serviço não aceitou a inscrição neste período. Confira as datas da campanha. Seus campos foram mantidos.':'Não foi possível confirmar o recebimento. Seus campos foram mantidos. Verifique sua conexão e tente novamente. Se a conexão caiu após o envio, consulte a organização antes de reenviar.';
    submitting=false;form.removeAttribute('aria-busy');updatePeriod();
  }
});
updatePartner();updatePeriod();setInterval(updatePeriod,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updatePeriod();});
setSlide(0);syncSound();showScreen('entry');
if(location.hash==='#inscricao')showRules(true);
else if(location.hash==='#regras')showRules();
window.addEventListener('hashchange',()=>{if(location.hash==='#inscricao')showRules(true);else if(location.hash==='#regras')showRules();});
