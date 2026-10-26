import { ACTIONS, COURT, STEP, PROFILES, emptyInput, type Action, type Input, type Mode, type Profile, type Vec3 } from './config';
import { Physics } from './physics';
export interface Athlete {
  x:number; z:number; facing:number; action:Action; age:number; charge:number; energy:number;
  profile:Profile; fromX:number; fromZ:number; released:boolean;
}
export function contestStrength(shooter:Athlete, defender:Athlete):number {
  const { activeStart, activeEnd } = ACTIONS.contest;
  if (defender.action !== 'contest' || defender.age < activeStart || defender.age > activeEnd) return 0;
  const dx=shooter.x-defender.x, dz=shooter.z-defender.z, d=Math.hypot(dx,dz);
  if(d>defender.profile.contestReach) return 0;
  const facingDot=d<0.01?1:(Math.sin(defender.facing)*dx+Math.cos(defender.facing)*dz)/d;
  if(facingDot<0.35) return 0;
  // A defender behind the shooter is less effective than one on the hoop side.
  const hoopDx=COURT.hoop.x-shooter.x, hoopDz=COURT.hoop.z-shooter.z;
  const hoopLen=Math.hypot(hoopDx,hoopDz)||1;
  const front=((-dx)*hoopDx+(-dz)*hoopDz)/(Math.max(d,0.01)*hoopLen);
  const vertical=Math.min(1.15,(defender.profile.height+defender.profile.vertical)/(shooter.profile.height+0.5));
  return Math.max(0,Math.min(1,(1-d/(defender.profile.contestReach+0.3))*vertical*(front<0?0.3:1)));
}
const athlete=(p:Profile,x:number,z:number):Athlete=>({profile:p,x,z,facing:Math.PI,action:'idle',age:0,charge:0,energy:100,fromX:x,fromZ:z,released:false});
export class Simulation {
  time=0; ticks=0; attacker:Athlete; defender:Athlete;
  mode:Mode='attack'; autoDefense=true; score=0; attempts=0; makes=0; contest=0;
  message='Segure e solte Espaço para arremessar'; possession:'held'|'flight'='held';
  shotAge=0; shotPoints=1; scored=false; prevBall:Vec3={x:0,y:0,z:0};
  aiWait=0; rng=0x12345678; lastTiming=0; ideal=0.65;
  constructor(public physics:Physics) {
    this.attacker=athlete(PROFILES[1],0,0.8); this.defender=athlete(PROFILES[2],0,-1);
    this.reset();
  }
  controlled() { return this.mode==='attack'?this.attacker:this.defender; }
  random() { this.rng=(Math.imul(1664525,this.rng)+1013904223)>>>0;return this.rng/4294967296; }
  setProfiles(attackId:string,defendId:string) {
    this.attacker.profile=PROFILES.find(p=>p.id===attackId)??PROFILES[1];
    this.defender.profile=PROFILES.find(p=>p.id===defendId)??PROFILES[2]; this.reset();
  }
  reset() {
    Object.assign(this.attacker,athlete(this.attacker.profile,0,0.8));
    Object.assign(this.defender,athlete(this.defender.profile,0,-0.65));
    this.defender.facing=0; this.possession='held';this.shotAge=0;this.scored=false;this.aiWait=0;this.contest=0;
    this.physics.hold(this.hand()); this.prevBall={...this.physics.ball.translation()};
    this.message=this.mode==='attack'?'Crie espaço e ataque a cesta':'Acompanhe o atacante • E para contestar';
  }
  hand():Vec3 {
    const p=this.attacker; let y=p.profile.height*0.58;
    if(p.action==='idle')y=0.16+Math.abs(Math.sin(this.time*7.5))*(p.profile.height*0.49);
    if(p.action==='charge')y=p.profile.height*0.8;
    if(p.action==='shot')y=p.profile.height+0.12+Math.min(p.age/ACTIONS.shot.windup,1)*0.3;
    if(p.action==='dunk')y=p.profile.height+Math.sin(Math.min(p.age/ACTIONS.dunk.release,1)*Math.PI/2)*1.05;
    return {x:p.x+0.28,y,z:p.z-0.15};
  }
  start(p:Athlete,action:Action) { p.action=action;p.age=0;p.released=false;p.fromX=p.x;p.fromZ=p.z; }
  move(p:Athlete,x:number,z:number,sprint:boolean) {
    if(p.action!=='idle'&&p.action!=='charge')return;
    const len=Math.hypot(x,z);if(!len)return;
    const speed=p.profile.speed*(sprint&&p.energy>5?1.3:1)*(p.action==='charge'?0.25:1);
    p.x+=x/Math.max(1,len)*speed*STEP;p.z+=z/Math.max(1,len)*speed*STEP;
    p.x=Math.max(-7,Math.min(7,p.x));p.z=Math.max(-7.3,Math.min(5,p.z));
    p.facing=Math.atan2(x,z);if(sprint)p.energy=Math.max(0,p.energy-14*STEP);
  }
  tryDunk() {
    const a=this.attacker,dist=Math.hypot(a.x,a.z-COURT.hoop.z);
    if(a.action!=='idle'||this.possession!=='held')return;
    if(!a.profile.dunk) {this.message='Este perfil de teste não possui enterrada';return;}
    if(dist>ACTIONS.dunk.range||dist<0.35||a.z<COURT.hoop.z) {this.message='Entre na zona de enterrada, à frente do aro';return;}
    if(a.energy<ACTIONS.dunk.minEnergy){this.message='Energia insuficiente';return;}
    a.energy-=22;this.start(a,'dunk');this.message='Enterrada • trajetória comprometida';
  }
  releaseShot() {
    const a=this.attacker, h=COURT.hoop;
    const from=this.hand(),dist=Math.hypot(a.x-h.x,a.z-h.z);
    this.contest=contestStrength(a,this.defender);
    this.lastTiming=Math.abs(a.charge-ACTIONS.shot.idealCharge);
    const timingError=Math.min(1,this.lastTiming/0.55);
    const fatigue=(100-a.energy)/100;
    const error=0.015+timingError*0.95+this.contest*1.35+Math.max(0,dist-4)*(100-a.profile.shot)*0.002+fatigue*0.2;
    const angle=this.random()*Math.PI*2, radius=error*(0.75+this.random()*0.5);
    const target={x:h.x+Math.cos(angle)*radius,y:h.y,z:h.z+Math.sin(angle)*radius};
    const duration=0.75+dist*0.055;
    this.physics.launch(from,{x:(target.x-from.x)/duration,y:(target.y-from.y+4.905*duration*duration)/duration,z:(target.z-from.z)/duration});
    this.possession='flight';this.attempts++;this.shotAge=0;this.scored=false;this.prevBall={...from};
    this.shotPoints=dist>=6.75?2:1;a.energy=Math.max(0,a.energy-5);
    this.message=this.contest>0.1?'Arremesso contestado':timingError<0.15?'Boa soltura':'Soltura fora do tempo ideal';
  }
  step(input:Input=emptyInput()) {
    this.time+=STEP;this.ticks++;
    const a=this.attacker,d=this.defender;
    for(const p of [a,d]){p.age+=STEP;if(p.action==='idle')p.energy=Math.min(100,p.energy+8*STEP);}
    this.move(this.controlled(),input.x,input.z,input.sprint);
    if(this.mode==='defend') {
      this.aiWait+=STEP;
      if(a.action==='idle'&&this.possession==='held') {
        const targetX=Math.sin(this.time*0.8)*2.7;
        this.move(a,Math.sign(targetX-a.x)*0.45,-0.12,false);
        if(this.aiWait>2.4){this.start(a,'charge');a.charge=0;this.aiWait=0;}
      }
      if(a.action==='charge'&&a.charge>=0.65)this.start(a,'shot');
      if(input.contest&&d.action==='idle'){this.start(d,'contest');d.energy=Math.max(0,d.energy-8);}
    } else {
      if(this.possession==='held'&&input.shoot&&a.action==='idle'){this.start(a,'charge');a.charge=0;}
      if(a.action==='charge'&&(input.release||a.charge>=ACTIONS.shot.maxCharge))this.start(a,'shot');
      if(input.dunk)this.tryDunk();
    }
    if(a.action==='charge'){a.charge+=STEP;a.facing=Math.atan2(-a.x,COURT.hoop.z-a.z);}
    if(this.mode==='attack'&&this.autoDefense) {
      const dx=a.x-d.x,dz=a.z-d.z,dist=Math.hypot(dx,dz);
      if(d.action==='idle'&&dist>1.05) this.move(d,dx/Math.max(dist,1),dz/Math.max(dist,1),false);
      d.facing=Math.atan2(dx,dz);
      if(d.action==='idle'&&((a.action==='shot')||(a.action==='dunk'&&a.age>0.28))&&dist<d.profile.contestReach+0.3)this.start(d,'contest');
    } else d.facing=Math.atan2(a.x-d.x,a.z-d.z);
    // Cylindrical athlete separation. During a dunk an obstruction interrupts the approach.
    const dx=a.x-d.x,dz=a.z-d.z,sep=Math.hypot(dx,dz),minSep=0.62+(a.profile.mass+d.profile.mass-180)*0.0007;
    if(sep<minSep) {
      const nx=sep>0.001?dx/sep:1,nz=sep>0.001?dz/sep:0;
      if(a.action==='dunk'&&a.age<ACTIONS.dunk.release){this.start(a,'idle');this.message='Trajetória fechada • enterrada interrompida';}
      a.x=d.x+nx*minSep;a.z=d.z+nz*minSep;
    }
    if(a.action==='shot') {
      if(!a.released&&a.age>=ACTIONS.shot.windup){this.releaseShot();a.released=true;}
      if(a.age>=ACTIONS.shot.windup+ACTIONS.shot.recovery)this.start(a,'idle');
    }
    if(a.action==='dunk') {
      const t=Math.min(1,a.age/ACTIONS.dunk.release);
      a.x=a.fromX*(1-t);a.z=a.fromZ+(COURT.hoop.z+0.35-a.fromZ)*t;
      a.facing=Math.PI;
      if(!a.released&&a.age>=ACTIONS.dunk.release) {
        this.contest=contestStrength(a,d);
        const blocked=this.contest>0.27;
        const from={x:blocked?0.5:0,y:3.32,z:COURT.hoop.z};
        this.physics.launch(from,{x:blocked?2:0,y:-2,z:blocked?1:0});
        this.possession='flight';this.shotAge=0;this.attempts++;this.shotPoints=1;this.scored=false;this.prevBall={...from};a.released=true;
        this.message=blocked?'Enterrada bloqueada':'Finalização no aro';
      }
      if(a.age>=ACTIONS.dunk.duration)this.start(a,'idle');
    }
    if(d.action==='contest'&&d.age>=ACTIONS.contest.duration)this.start(d,'idle');
    if(this.possession==='held')this.physics.hold(this.hand());
    this.physics.step();
    if(this.possession==='flight') {
      this.shotAge+=STEP;
      const b=this.physics.ball.translation(),h=COURT.hoop;
      if(!this.scored&&this.prevBall.y>h.y&&b.y<=h.y&&b.y<this.prevBall.y) {
        const t=(this.prevBall.y-h.y)/(this.prevBall.y-b.y);
        const x=this.prevBall.x+(b.x-this.prevBall.x)*t,z=this.prevBall.z+(b.z-this.prevBall.z)*t;
        if(Math.hypot(x-h.x,z-h.z)<0.23-COURT.ballRadius){this.score+=this.shotPoints;this.makes++;this.scored=true;this.message=`Cesta! +${this.shotPoints}`;}
      }
      this.prevBall={...b};
      if(this.shotAge>3.2||b.y < -2||Math.abs(b.x)>10||Math.abs(b.z)>12) this.reset();
    }
  }
}
