export const STEP = 1 / 60;
export const COURT = { halfWidth: 7.5, near: 5.7, far: -8.3, hoop: { x: 0, y: 3.05, z: -6.5 }, ballRadius: 0.12 };
export const ACTIONS = {
  shot: { windup: 0.18, recovery: 0.46, idealCharge: 0.65, maxCharge: 1.35 },
  dunk: { range: 2.3, duration: 1.12, release: 0.68, minEnergy: 22 },
  contest: { duration: 0.72, activeStart: 0.12, activeEnd: 0.43, recovery: 0.29 },
};
export interface Profile {
  id: string; label: string; height: number; mass: number; wingspan: number;
  build: string; speed: number; shot: number; vertical: number; dunk: boolean; contestReach: number;
}
// Synthetic test fixtures, not measurements or ratings of historical athletes.
export const PROFILES: Profile[] = [
  { id: 'shooter', label: 'Arremessador', height: 1.98, mass: 94, wingspan: 2.04, build: 'esguio', speed: 4.4, shot: 92, vertical: 0.65, dunk: false, contestReach: 1.25 },
  { id: 'slasher', label: 'Infiltrador', height: 1.96, mass: 98, wingspan: 2.10, build: 'atlético', speed: 5.1, shot: 72, vertical: 0.92, dunk: true, contestReach: 1.35 },
  { id: 'stopper', label: 'Marcador de perímetro', height: 2.01, mass: 102, wingspan: 2.19, build: 'musculoso', speed: 4.8, shot: 76, vertical: 0.76, dunk: true, contestReach: 1.65 },
  { id: 'rim', label: 'Protetor de aro', height: 2.13, mass: 116, wingspan: 2.31, build: 'robusto', speed: 3.8, shot: 62, vertical: 0.72, dunk: true, contestReach: 1.9 },
];
export type Mode = 'attack' | 'defend';
export type Action = 'idle' | 'charge' | 'shot' | 'dunk' | 'contest';
export type Vec3 = { x: number; y: number; z: number };
export type Input = { x: number; z: number; sprint: boolean; shoot: boolean; release: boolean; dunk: boolean; contest: boolean };
export const emptyInput = (): Input => ({ x: 0, z: 0, sprint: false, shoot: false, release: false, dunk: false, contest: false });
