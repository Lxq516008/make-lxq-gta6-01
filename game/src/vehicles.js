// Cars: types, creation and the player's driving physics (arcade, with handbrake drift,
// damage and breakdowns). Collisions with buildings and other cars live here too.
import { CAR, CAR_COLORS, CAR_TYPES } from './config.js';

let nextId = 1;
export function createCar(x, y, angle, kind, rng) {
  const type = rng ? rng.pick(CAR_TYPES) : CAR_TYPES[0];
  return {
    id: nextId++, kind, // 'player' | 'traffic' | 'parked' | 'police' | 'target'
    x, y, angle, speed: 0, damage: 0, broken: false,
    w: 46, h: 22, color: kind === 'police' ? '#e8e4da' : (rng ? rng.pick(CAR_COLORS) : '#d94f3d'),
    type: type.name, maxSpeed: type.max, accel: type.accel,
    steer: 0, targetSpeed: 0, driver: kind === 'traffic',
  };
}

// Player driving: W/S throttle, A/D steer, Space handbrake. Returns true on a hard impact.
export function drivePlayerCar(G, car, dt, input) {
  const axis = input.axis();
  const handbrake = input.punch();
  const max = car.broken ? 90 : car.maxSpeed;
  if (axis.y < 0) car.speed += car.accel * dt;
  else if (axis.y > 0) car.speed -= (car.speed > 0 ? CAR.brake : CAR.reverse) * dt;
  else car.speed *= Math.pow(0.4, dt); // coast
  if (handbrake) car.speed *= Math.pow(0.12, dt);
  car.speed = Math.max(-CAR.maxReverse, Math.min(max, car.speed));
  const steerInput = axis.x;
  const steerAmt = steerInput * (car.speed >= 0 ? 1 : -1) * Math.min(1, Math.abs(car.speed) / 120) * (handbrake ? 1.7 : 1);
  car.angle += steerAmt * CAR.grip * dt * (handbrake ? 1.4 : 1);
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  const hit = G.city.collide(nx, ny, 20);
  if (hit) {
    if (Math.abs(car.speed) > 160) {
      car.damage += Math.abs(car.speed) / 14;
      G.audio.crash();
      addCrash(G, nx, ny, 14);
      G.player.health = Math.max(0, G.player.health - Math.abs(car.speed) / 60);
      if (car.damage >= 100) { car.broken = true; G.toast('Car broke down!'); }
    }
    car.speed *= -0.25;
    return true;
  }
  const prevX = car.x, prevY = car.y;
  car.x = nx; car.y = ny;
  if (handbrake && Math.abs(car.speed) > 200 && G.rng.next() < 0.5) {
    G.skids.push({ x1: prevX, y1: prevY, x2: nx, y2: ny, life: 6 });
  }
  if (Math.abs(car.speed) > 320 && G.rng.next() < 0.3) addDust(G, car.x, car.y);
  return false;
}

export function carHitsCar(a, b) {
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  if (d > 44 || d === 0) return false;
  const push = (44 - d) / 2;
  const ux = (a.x - b.x) / d, uy = (a.y - b.y) / d;
  a.x += ux * push; a.y += uy * push;
  b.x -= ux * push; b.y -= uy * push;
  const impact = Math.abs(a.speed - b.speed);
  if (impact > 120) {
    a.damage += impact / 22; b.damage += impact / 22;
    a.speed *= 0.5; b.speed *= 0.5;
    if (a.kind === 'player' || b.kind === 'player') { /* sound handled by caller */ }
  }
  return true;
}

export function addCrash(G, x, y, n) {
  for (let i = 0; i < n; i += 1) {
    G.particles.push({ x, y, vx: G.rng.range(-160, 160), vy: G.rng.range(-160, 160), life: G.rng.range(0.3, 0.8), max: 0.8, color: G.rng.pick(['#ffb347', '#e5484d', '#888']) });
  }
}
export function addDust(G, x, y) {
  G.particles.push({ x, y, vx: G.rng.range(-40, 40), vy: G.rng.range(-40, 40), life: 0.5, max: 0.5, color: '#d8c9a3' });
}
