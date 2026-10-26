import { emptyInput, type Input } from './core/config';
export class Controls {
  keys=new Set<string>(); touchX=0;touchZ=0;touchShoot=false;release=false;dunk=false;contest=false;previousPadShoot=false;
  constructor() {
    const gameplay=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyF','KeyE','ShiftLeft','ShiftRight']);
    window.addEventListener('keydown',e=>{
      if((e.target as HTMLElement)?.closest('select,input,button,textarea'))return;
      if(gameplay.has(e.code))e.preventDefault();
      if(e.repeat)return;this.keys.add(e.code);if(e.code==='KeyF')this.dunk=true;if(e.code==='KeyE')this.contest=true;
    });
    window.addEventListener('keyup',e=>{this.keys.delete(e.code);if(e.code==='Space')this.release=true;});
    window.addEventListener('blur',()=>this.clear());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clear();});
    this.bindTouch();
  }
  clear(){this.keys.clear();this.touchX=0;this.touchZ=0;this.touchShoot=false;this.release=true;this.dunk=false;this.contest=false;}
  bindTouch() {
    const stick=document.querySelector<HTMLElement>('#stick')!,knob=stick.querySelector<HTMLElement>('span')!;
    let id:number|null=null;
    const update=(e:PointerEvent)=>{const r=stick.getBoundingClientRect();const x=(e.clientX-r.left-r.width/2)/40,z=(e.clientY-r.top-r.height/2)/40,l=Math.max(1,Math.hypot(x,z));this.touchX=x/l;this.touchZ=z/l;knob.style.transform=`translate(${this.touchX*30}px,${this.touchZ*30}px)`;};
    stick.addEventListener('pointerdown',e=>{if(id!==null)return;id=e.pointerId;stick.setPointerCapture(id);update(e);});
    stick.addEventListener('pointermove',e=>{if(e.pointerId===id)update(e);});
    const end=(e:PointerEvent)=>{if(e.pointerId!==id)return;id=null;this.touchX=0;this.touchZ=0;knob.style.transform='';};
    stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
    document.querySelectorAll<HTMLElement>('[data-action]').forEach(button=>{
      button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);const action=button.dataset.action;if(action==='shoot')this.touchShoot=true;if(action==='dunk')this.dunk=true;if(action==='contest')this.contest=true;});
      const finish=()=>{if(button.dataset.action==='shoot'&&this.touchShoot){this.touchShoot=false;this.release=true;}};
      button.addEventListener('pointerup',finish);button.addEventListener('pointercancel',finish);
    });
  }
  read():Input {
    const pad=Array.from(navigator.getGamepads?.()??[]).find(p=>p?.connected);
    const padShoot=!!pad?.buttons[0]?.pressed;
    if(this.previousPadShoot&&!padShoot)this.release=true;this.previousPadShoot=padShoot;
    const dead=(v=0)=>Math.abs(v)<0.18?0:v;
    const i={...emptyInput(),x:Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'))+this.touchX+dead(pad?.axes[0]),z:Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))+this.touchZ+dead(pad?.axes[1]),sprint:this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')||!!pad?.buttons[7]?.pressed,shoot:this.keys.has('Space')||this.touchShoot||padShoot,release:this.release,dunk:this.dunk,contest:this.contest};
    // Button actions are edges, not repeated every render frame.
    if(pad){if(pad.buttons[2]?.pressed&&!this.keys.has('padDunk'))i.dunk=true;if(pad.buttons[1]?.pressed&&!this.keys.has('padContest'))i.contest=true;pad.buttons[2]?.pressed?this.keys.add('padDunk'):this.keys.delete('padDunk');pad.buttons[1]?.pressed?this.keys.add('padContest'):this.keys.delete('padContest');}
    this.release=false;this.dunk=false;this.contest=false;return i;
  }
}
