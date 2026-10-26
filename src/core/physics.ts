import RAPIER from '@dimforge/rapier3d-compat';
import { COURT, STEP, type Vec3 } from './config';
export class Physics {
  world: RAPIER.World;
  ball: RAPIER.RigidBody;
  constructor() {
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = STEP;
    const fixed = (x: number, y: number, z: number, hx: number, hy: number, hz: number) => {
      this.world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x,y,z).setRestitution(0.65));
    };
    fixed(0,-0.1,-1.3,8,0.1,7.6);
    fixed(0,3.45,-7.02,0.9,0.55,0.04);
    // Segmented physical rim, matching the rendered torus.
    const hoop = COURT.hoop;
    for (let i=0;i<24;i++) {
      const a=i/24*Math.PI*2;
      this.world.createCollider(RAPIER.ColliderDesc.ball(0.022).setTranslation(hoop.x+Math.cos(a)*0.23,hoop.y,hoop.z+Math.sin(a)*0.23).setRestitution(0.6));
    }
    this.ball=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,1,0).setCcdEnabled(true));
    this.world.createCollider(RAPIER.ColliderDesc.ball(COURT.ballRadius).setMass(0.62).setRestitution(0.76).setFriction(0.65),this.ball);
    this.hold({x:0,y:1,z:0});
  }
  static async create() { await RAPIER.init(); return new Physics(); }
  hold(p: Vec3) {
    this.ball.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);
    this.ball.setTranslation(p,true); this.ball.setNextKinematicTranslation(p);
    this.ball.setLinvel({x:0,y:0,z:0},true);
  }
  launch(p:Vec3,v:Vec3) {
    this.ball.setBodyType(RAPIER.RigidBodyType.Dynamic,true);
    this.ball.setTranslation(p,true); this.ball.setLinvel(v,true);
    this.ball.setAngvel({x:-3,y:0,z:0},true);
  }
  step() { this.world.step(); }
  dispose() { this.world.free(); }
}
