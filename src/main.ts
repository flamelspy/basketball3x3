import './style.css';
import { ACTIONS, PROFILES, STEP, emptyInput, type Input, type Mode } from './core/config';
import { Physics } from './core/physics';
import { Simulation } from './core/simulation';
import { CourtView } from './view/scene';
import { Controls } from './input';
const options=PROFILES.map(p=>`<option value="${p.id}">${p.label}</option>`).join('');
document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
<main id="court" aria-label="Quadra 3D de basquete"></main>
<header><a class="brand" href="#"><span class="brand-icon">B<span>3</span></span><span>BASKETBALL<small>LABORATÓRIO 1×1 <b>v0.1</b></small></span></a><div class="header-actions"><button id="debug" aria-pressed="true">Áreas <span>ON</span></button><button id="pause" aria-pressed="false">Pausar</button><button id="settings" aria-expanded="true" aria-controls="panel">Ajustes</button></div></header>
<section class="score" aria-label="Resultado do treino"><div><small>PONTOS</small><strong id="score">00</strong></div><span></span><div><small>APROVEITAMENTO</small><strong id="ratio">0/0</strong></div></section>
<aside id="panel"><div class="eyebrow">SESSÃO DE TREINO</div><h1>Encontre seu espaço.</h1><p>Teste o tempo da soltura e a distância de contestação.</p>
<label>Você controla<select id="mode"><option value="attack">Atacante · verde</option><option value="defend">Defensor · laranja</option></select></label>
<label>Perfil do atacante<select id="attacker">${options}</select></label><label>Perfil do defensor<select id="defender">${options}</select></label>
<div id="biotype" class="biotype"></div>
<label class="toggle"><input id="ai" type="checkbox" checked> Marcação automática no ataque</label>
<button id="reset" class="primary">Reposicionar jogadores <span>R</span></button>
<div class="legend"><i></i> Alcance de enterrada <i></i> Alcance de contestação</div>
<p class="disclaimer">Perfis sintéticos de teste. Modelos e movimentos provisórios.</p></aside>
<section class="feedback"><div id="state">LIVRE</div><div id="message" role="status">Carregando física…</div><div class="meter"><div class="sweet"></div><div id="charge"></div><i id="cursor"></i></div><div class="meter-label"><span>SOLTURA IDEAL · 0,65 s</span><span id="timing">0,00 s</span></div><div class="telemetry"><span>ENERGIA <b id="energy">100%</b></span><span>CONTESTAÇÃO <b id="contest">0%</b></span><span>FASE <b id="phase">—</b></span></div></section>
<footer><span><kbd>WASD</kbd> mover <kbd>Shift</kbd> correr <kbd>Espaço</kbd> segurar / soltar</span><span><kbd>F</kbd> enterrar <kbd>E</kbd> contestar <kbd>R</kbd> reiniciar</span><small>Controle: analógico · A arremesso · X enterrada · B contestação</small></footer>
<div id="touch"><div id="stick" aria-label="Direcional de movimento"><span></span></div><div class="touch-actions"><button data-action="contest">Contestar</button><button data-action="dunk">Enterrar</button><button data-action="shoot">Arremesso<br><small>segure / solte</small></button></div></div>
<div id="loading"><div class="spinner"></div><h2>Preparando a quadra</h2><p>Inicializando simulação e física</p></div>
<div id="paused" hidden><h2>Treino pausado</h2><p>Continue pelo botão no topo.</p></div>`;
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
async function start() {
  const physics=await Physics.create(),sim=new Simulation(physics),view=new CourtView(el('court')),controls=new Controls();
  const attacker=el<HTMLSelectElement>('attacker'),defender=el<HTMLSelectElement>('defender');attacker.value='slasher';defender.value='stopper';
  let paused=false;
  const biotype=()=>{const p=sim.attacker.profile;el('biotype').textContent=`${p.height.toFixed(2)} m · ${p.mass} kg · ${p.build} · envergadura ${p.wingspan.toFixed(2)} m`;};biotype();
  const updateProfiles=()=>{sim.setProfiles(attacker.value,defender.value);controls.clear();biotype();attacker.blur();defender.blur();};
  attacker.addEventListener('change',updateProfiles);defender.addEventListener('change',updateProfiles);
  el<HTMLSelectElement>('mode').addEventListener('change',e=>{sim.mode=(e.target as HTMLSelectElement).value as Mode;sim.reset();controls.clear();(e.target as HTMLSelectElement).blur();});
  el<HTMLInputElement>('ai').addEventListener('change',e=>{sim.autoDefense=(e.target as HTMLInputElement).checked;(e.target as HTMLInputElement).blur();});
  if(matchMedia('(max-width: 700px)').matches){el('panel').hidden=true;el('settings').setAttribute('aria-expanded','false');}
  document.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>button.blur()));
  const reset=()=>{sim.reset();controls.clear();};el('reset').addEventListener('click',reset);
  window.addEventListener('keydown',e=>{if((e.target as HTMLElement).closest('select,input,button'))return;if(e.code==='KeyR')reset();if(e.code==='Escape')togglePause();});
  el('debug').addEventListener('click',()=>{view.debug=!view.debug;el('debug').setAttribute('aria-pressed',String(view.debug));el('debug').innerHTML=`Áreas <span>${view.debug?'ON':'OFF'}</span>`;});
  el('settings').addEventListener('click',()=>{el('panel').hidden=!el('panel').hidden;el('settings').setAttribute('aria-expanded',String(!el('panel').hidden));});
  const togglePause=()=>{paused=!paused;controls.clear();el('paused').hidden=!paused;el('pause').textContent=paused?'Continuar':'Pausar';el('pause').setAttribute('aria-pressed',String(paused));};
  el('pause').addEventListener('click',togglePause);
  window.addEventListener('resize',()=>view.resize());
  el('loading').hidden=true;
  let previous=performance.now(),accumulator=0,pending:Input=emptyInput(),lastHud=0;
  function frame(now:number) {
    const dt=Math.min((now-previous)/1000,0.1);previous=now;
    if(!paused&&!document.hidden) {
      const fresh=controls.read();pending={...fresh,release:pending.release||fresh.release,dunk:pending.dunk||fresh.dunk,contest:pending.contest||fresh.contest};
      accumulator+=dt;
      while(accumulator>=STEP){sim.step(pending);pending={...pending,release:false,dunk:false,contest:false};accumulator-=STEP;}
    } else {accumulator=0;pending=emptyInput();}
    view.render(sim);
    if(now-lastHud>60) {
      const a=sim.attacker,active=sim.controlled(),c=Math.min(a.charge/ACTIONS.shot.maxCharge,1)*100;
      el('score').textContent=String(sim.score).padStart(2,'0');el('ratio').textContent=`${sim.makes}/${sim.attempts}`;
      el('message').textContent=sim.message;
      const states={idle:'LIVRE',charge:'PREPARANDO',shot:'ARREMESSO',dunk:'ENTERRADA',contest:'CONTESTAÇÃO'};
      el('state').textContent=states[active.action];el('charge').style.width=`${a.action==='charge'?c:0}%`;el('cursor').style.left=`${a.action==='charge'?c:0}%`;
      el('timing').textContent=`${(a.action==='charge'?a.charge:0).toFixed(2).replace('.',',')} s`;
      el('energy').textContent=`${Math.round(active.energy)}%`;el('contest').textContent=`${Math.round(sim.contest*100)}%`;
      el('phase').textContent=active.action==='idle'?'livre':`${active.age.toFixed(2)} s`;
      lastHud=now;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
start().catch(error=>{console.error(error);el('loading').innerHTML='<h2>Não foi possível iniciar</h2><p>Verifique se o navegador oferece WebGL 2 e recarregue a página.</p>';});
