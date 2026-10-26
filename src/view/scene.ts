import * as THREE from 'three';
import { ACTIONS, COURT, type Profile } from '../core/config';
import type { Athlete, Simulation } from '../core/simulation';
const mat=(color:number,roughness=0.7)=>new THREE.MeshStandardMaterial({color,roughness});
const wood=mat(0xc79360), navy=mat(0x142b3b), cream=mat(0xe9f0df), orange=mat(0xff8645);
function mesh(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0) {
  const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
function box(parent:THREE.Object3D,w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number) { return mesh(new THREE.BoxGeometry(w,h,d),m,parent,x,y,z); }
function line(parent:THREE.Object3D,pts:THREE.Vector3[],color=0xfff3d5) {
  const g=new THREE.BufferGeometry().setFromPoints(pts);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color}));parent.add(l);return l;
}
function arc(parent:THREE.Object3D,x:number,z:number,r:number,start:number,end:number,color?:number,y=0.025) {
  return line(parent,Array.from({length:81},(_,i)=>{const a=start+(end-start)*i/80;return new THREE.Vector3(x+Math.cos(a)*r,y,z+Math.sin(a)*r);}),color);
}
class PlayerView {
  root=new THREE.Group(); body=new THREE.Group(); leftArm=new THREE.Group();rightArm=new THREE.Group();leftLeg=new THREE.Group();rightLeg=new THREE.Group();
  constructor(parent:THREE.Object3D,color:number) {
    parent.add(this.root);this.root.add(this.body);
    const skin=mat(color===0x62e9c7?0x8c573f:0xb58062),jersey=mat(color),shorts=mat(0x172b3d),shoe=mat(0xf2ead9);
    box(this.body,0.46,0.57,0.29,jersey,0,1.14,0);
    box(this.body,0.45,0.29,0.29,shorts,0,0.72,0);
    mesh(new THREE.SphereGeometry(0.155,12,10),skin,this.body,0,1.63,0);
    mesh(new THREE.SphereGeometry(0.158,12,8,0,Math.PI*2,0,Math.PI/2),mat(0x201d1c),this.body,0,1.67,0);
    box(this.body,0.12,0.12,0.12,skin,0,1.43,0);
    for(const [arm,side] of [[this.leftArm,-1],[this.rightArm,1]] as const) {
      arm.position.set(side*0.29,1.34,0);this.body.add(arm);
      mesh(new THREE.CapsuleGeometry(0.065,0.43,3,7),skin,arm,0,-0.27,0);
      mesh(new THREE.SphereGeometry(0.074,8,6),skin,arm,0,-0.54,0);
    }
    for(const [leg,side] of [[this.leftLeg,-1],[this.rightLeg,1]] as const) {
      leg.position.set(side*0.13,0.64,0);this.body.add(leg);
      mesh(new THREE.CapsuleGeometry(0.085,0.42,3,7),skin,leg,0,-0.23,0);
      box(leg,0.17,0.12,0.29,shoe,0,-0.57,0.06);
    }
    const ring=mesh(new THREE.RingGeometry(0.36,0.41,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:0.9}),this.root,0,0.012,0);ring.rotation.x=-Math.PI/2;ring.castShadow=false;
  }
  update(p:Athlete,time:number,moving:boolean) {
    this.root.position.set(p.x,0,p.z);this.body.rotation.y=p.facing;
    const scale=p.profile.height/1.8, bulk=Math.sqrt(p.profile.mass/95);
    this.body.scale.set(scale*bulk,scale,scale*bulk);
    const stride=moving?Math.sin(time*11)*0.55:0;
    this.leftLeg.rotation.x=stride;this.rightLeg.rotation.x=-stride;
    this.leftArm.rotation.x=-stride*0.6;this.rightArm.rotation.x=stride*0.6;this.body.position.y=0;
    if(p.action==='charge'){this.leftArm.rotation.x=-2.1;this.rightArm.rotation.x=-2.1;this.body.position.y=-0.06;}
    if(p.action==='shot') {
      this.leftArm.rotation.x=-2.8;this.rightArm.rotation.x=-2.9;
      this.body.position.y=Math.sin(Math.min(p.age/0.6,1)*Math.PI)*0.3;
    }
    if(p.action==='contest') {
      this.leftArm.rotation.x=-Math.PI;this.rightArm.rotation.x=-Math.PI;
      this.body.position.y=Math.sin(Math.min(p.age/ACTIONS.contest.duration,1)*Math.PI)*p.profile.vertical*0.6;
    }
    if(p.action==='dunk') {
      this.rightArm.rotation.x=-Math.PI;this.leftArm.rotation.x=-1.5;
      this.body.position.y=Math.sin(Math.min(p.age/ACTIONS.dunk.duration,1)*Math.PI)*p.profile.vertical;
      this.leftLeg.rotation.x=0.7;this.rightLeg.rotation.x=-0.3;
    }
  }
}
export class CourtView {
  renderer:THREE.WebGLRenderer;scene=new THREE.Scene();camera:THREE.PerspectiveCamera;
  attacker:PlayerView;defender:PlayerView;ball:THREE.Mesh;zone:THREE.Line;defZone:THREE.Line;
  prevA=new THREE.Vector2();prevD=new THREE.Vector2();debug=true;
  constructor(public container:HTMLElement) {
    this.renderer=new THREE.WebGLRenderer({antialias:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x101d29);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.3;container.append(this.renderer.domElement);
    this.scene.fog=new THREE.Fog(0x101d29,28,60);
    this.camera=new THREE.PerspectiveCamera(43,1,0.1,100);this.camera.position.set(0,13,17);this.camera.lookAt(0,0,-1.7);
    this.scene.add(new THREE.HemisphereLight(0xd8f3ff,0x6b543c,2));
    const sun=new THREE.DirectionalLight(0xffedcd,3);sun.position.set(-6,14,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,far:40});sun.shadow.bias=-0.0004;this.scene.add(sun);
    box(this.scene,60,0.2,60,mat(0x132532),0,-0.24,-2);
    box(this.scene,15,0.15,14,wood,0,-0.08,-1.3);
    const paint=box(this.scene,4.9,0.012,5.6,navy,0,0.005,-5.5);paint.receiveShadow=true;
    for(let i=0;i<30;i++)line(this.scene,[new THREE.Vector3(-7.5+i*0.5,0.012,-8.3),new THREE.Vector3(-7.5+i*0.5,0.012,5.7)],0xa9784e);
    line(this.scene,[[-7.5,-8.3],[7.5,-8.3],[7.5,5.7],[-7.5,5.7],[-7.5,-8.3]].map(([x,z])=>new THREE.Vector3(x,0.025,z)));
    line(this.scene,[[-2.45,-8.3],[-2.45,-2.7],[2.45,-2.7],[2.45,-8.3]].map(([x,z])=>new THREE.Vector3(x,0.026,z)));
    arc(this.scene,0,-2.7,1.8,0,Math.PI);arc(this.scene,0,COURT.hoop.z,6.75,0,Math.PI);
    line(this.scene,[new THREE.Vector3(-6.75,0.026,-8.3),new THREE.Vector3(-6.75,0.026,-6.5)]);
    line(this.scene,[new THREE.Vector3(6.75,0.026,-8.3),new THREE.Vector3(6.75,0.026,-6.5)]);
    arc(this.scene,0,5.7,1.8,Math.PI,Math.PI*2);
    arc(this.scene,0,COURT.hoop.z,1.25,0,Math.PI);
    box(this.scene,0.18,3.5,0.18,cream,0,1.75,-7.65);box(this.scene,0.15,0.15,0.7,cream,0,3.45,-7.3);
    box(this.scene,1.8,1.1,0.08,mat(0xdce6e2),0,3.45,-7.02);
    line(this.scene,[[-0.3,3.05],[-0.3,3.5],[0.3,3.5],[0.3,3.05],[-0.3,3.05]].map(([x,y])=>new THREE.Vector3(x,y,-6.97)),0x233d4b);
    const hoop=mesh(new THREE.TorusGeometry(0.23,0.022,8,40),orange,this.scene,0,3.05,-6.5);hoop.rotation.x=Math.PI/2;
    for(let i=0;i<12;i++){const a=i*Math.PI/6;line(this.scene,[new THREE.Vector3(Math.cos(a)*0.23,3.04,-6.5+Math.sin(a)*0.23),new THREE.Vector3(Math.cos(a+0.2)*0.14,2.62,-6.5+Math.sin(a+0.2)*0.14)],0xe1e7d4);}
    // Repeated empty bleachers; no external assets or downloads at runtime.
    for(const side of [-1,1])for(let row=0;row<3;row++)box(this.scene,1.0,0.3+row*0.3,14,mat(row%2?0x243b48:0x1c303d),side*(9+row*1.1),row*0.15,-1);
    box(this.scene,22,1,0.2,navy,0,0.4,-10);
    this.attacker=new PlayerView(this.scene,0x62e9c7);this.defender=new PlayerView(this.scene,0xff8645);
    this.ball=mesh(new THREE.SphereGeometry(COURT.ballRadius,20,14),mat(0xe77a2f,0.85),this.scene);
    for(const rot of [0,Math.PI/2]){const seam=new THREE.Mesh(new THREE.TorusGeometry(0.121,0.003,4,32),mat(0x392821));seam.rotation.y=rot;this.ball.add(seam);}
    this.zone=arc(this.scene,0,COURT.hoop.z,ACTIONS.dunk.range,0,Math.PI,0x62e9c7,0.04);
    this.defZone=arc(this.scene,0,0,1,0,Math.PI*2,0xff8645,0.04);
    this.resize();
  }
  resize() {
    const w=this.container.clientWidth,h=this.container.clientHeight;
    this.renderer.setSize(w,h);this.camera.aspect=w/h;
    this.camera.position.set(0,w/h<0.85?31:13,w/h<0.85?34:17);this.camera.lookAt(0,0,-1.5);this.camera.updateProjectionMatrix();
  }
  render(s:Simulation) {
    const a=s.attacker,d=s.defender;
    const movingA=this.prevA.distanceTo(new THREE.Vector2(a.x,a.z))>0.001,movingD=this.prevD.distanceTo(new THREE.Vector2(d.x,d.z))>0.001;
    this.attacker.update(a,s.time,movingA);this.defender.update(d,s.time,movingD);
    this.prevA.set(a.x,a.z);this.prevD.set(d.x,d.z);
    const b=s.physics.ball.translation();this.ball.position.set(b.x,b.y,b.z);
    const q=s.physics.ball.rotation();this.ball.quaternion.set(q.x,q.y,q.z,q.w);
    this.zone.visible=this.debug;this.defZone.visible=this.debug;
    this.defZone.scale.setScalar(d.profile.contestReach);this.defZone.position.set(d.x,0,d.z);
    (this.defZone.material as THREE.LineBasicMaterial).color.set(d.action==='contest'&&d.age>=ACTIONS.contest.activeStart&&d.age<=ACTIONS.contest.activeEnd?0xfff0b1:0xff8645);
    this.renderer.render(this.scene,this.camera);
  }
}
