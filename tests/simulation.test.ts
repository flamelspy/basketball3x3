import test from 'node:test';
import assert from 'node:assert/strict';
import { Physics } from '../src/core/physics';
import { Simulation, contestStrength } from '../src/core/simulation';
import { ACTIONS, COURT, STEP, emptyInput } from '../src/core/config';
const physics=await Physics.create();
const sim=new Simulation(physics);
test.after(()=>physics.dispose());
function fresh(){sim.mode='attack';sim.autoDefense=false;sim.setProfiles('slasher','stopper');sim.defender.x=6;sim.defender.z=3;}
test('shot releases only after windup and returns to idle',()=>{
  fresh();sim.step({...emptyInput(),shoot:true});for(let i=0;i<37;i++)sim.step({...emptyInput(),shoot:true});
  assert.equal(sim.attacker.action,'charge');assert.equal(sim.possession,'held');
  sim.step({...emptyInput(),release:true});assert.equal(sim.attacker.action,'shot');assert.equal(sim.possession,'held');
  for(let i=0;i<12;i++)sim.step();assert.equal(sim.possession,'flight');
  for(let i=0;i<35;i++)sim.step();assert.equal(sim.attacker.action,'idle');
});
test('contest requires an active window, distance and facing',()=>{
  fresh();const a=sim.attacker,d=sim.defender;a.x=0;a.z=0;d.x=0;d.z=-0.7;d.facing=0;d.action='contest';
  d.age=0;assert.equal(contestStrength(a,d),0);d.age=0.2;assert.ok(contestStrength(a,d)>0.4);
  d.facing=Math.PI;assert.equal(contestStrength(a,d),0);d.facing=0;d.z=-3;assert.equal(contestStrength(a,d),0);
  d.z=-0.7;d.age=ACTIONS.contest.activeEnd+STEP;assert.equal(contestStrength(a,d),0);
});
test('dunk checks profile, range and energy',()=>{
  fresh();sim.tryDunk();assert.equal(sim.attacker.action,'idle');
  sim.attacker.z=COURT.hoop.z+1.8;sim.attacker.energy=10;sim.tryDunk();assert.equal(sim.attacker.action,'idle');
  sim.attacker.energy=100;sim.tryDunk();assert.equal(sim.attacker.action,'dunk');
  fresh();sim.attacker.profile={...sim.attacker.profile,dunk:false};sim.attacker.z=COURT.hoop.z+1;sim.tryDunk();assert.equal(sim.attacker.action,'idle');
});
test('descending ball through rim scores once; ascending ball does not',()=>{
  fresh();const before=sim.score;sim.possession='flight';sim.scored=false;sim.shotPoints=2;sim.shotAge=0;
  sim.physics.launch({x:0,y:3.10,z:COURT.hoop.z},{x:0,y:-4,z:0});sim.prevBall={x:0,y:3.10,z:COURT.hoop.z};
  sim.step();assert.equal(sim.score,before+2);for(let i=0;i<12;i++)sim.step();assert.equal(sim.score,before+2);
  fresh();const points=sim.score;sim.possession='flight';sim.physics.launch({x:0,y:3,z:COURT.hoop.z},{x:0,y:4,z:0});sim.prevBall={x:0,y:3,z:COURT.hoop.z};sim.step();assert.equal(sim.score,points);
});
test('athletes stay separated and court movement remains bounded',()=>{
  fresh();sim.attacker.x=0;sim.attacker.z=0;sim.defender.x=0;sim.defender.z=0;sim.step();assert.ok(Math.hypot(sim.attacker.x-sim.defender.x,sim.attacker.z-sim.defender.z)>=0.62);
  for(let i=0;i<600;i++)sim.step({...emptyInput(),x:1,z:1});assert.ok(sim.attacker.x<=7&&sim.attacker.z<=5);
});
test('defense mode produces an AI shot and reset clears actions',()=>{
  fresh();sim.mode='defend';const attempts=sim.attempts;for(let i=0;i<230;i++)sim.step();assert.ok(sim.attempts>attempts);
  sim.reset();assert.equal(sim.possession,'held');assert.equal(sim.attacker.action,'idle');assert.equal(sim.defender.action,'idle');assert.equal(sim.attacker.energy,100);
});
test('uncontested dunk completes with one basket',()=>{
  fresh();sim.attacker.z=COURT.hoop.z+1.7;const points=sim.score;sim.tryDunk();for(let i=0;i<90;i++)sim.step();assert.equal(sim.score,points+1);
});
