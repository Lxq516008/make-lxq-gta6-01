// Wanted system and police pursuit: stars 0-5, police cars spawn and chase/ram the player,
// wanted decays when the player lays low out of sight, busted on foot, wasted at 0 health.
import { createCar } from './vehicles.js';

export function addWanted(G, n, reason) {
  const before = G.player.wanted;
  G.player.wanted = Math.max(0, Math.min(5, G.player.wanted + n));
  if (G.player.wanted > before) {
    G.player.lastCrime = G.time;
    G.player.wantedFlash = 1;
    if (reason) G.toast(reason);
  }
}

export function spawnPolice(G) {
  const p = G.player;
  const angle = G.rng.range(0, Math.PI * 2);
  const x = Math.max(80, Math.min(2880, p.x + Math.cos(angle) * 500));
  const y = Math.max(80, Math.min(2320, p.y + Math.sin(angle) * 500));
  const car = createCar(x, y, Math.atan2(p.y - y, p.x - x), 'police', G.rng);
  car.maxSpeed = 540 + G.player.wanted * 18;
  car.accel = 520;
  G.cars.push(car);
  return car;
}

export function updatePolice(G, dt) {
  const p = G.player;
  const want = Math.min(4, p.wanted);
  const active = G.cars.filter((c) => c.kind === 'police');
  if (p.wanted > 0 && active.length < want && G.rng.next() < dt * 0.8) spawnPolice(G);
  if (p.wanted === 0) {
    // Stand down: police cars drive off and despawn far away.
    for (const c of active) {
      c.angle += 0.4 * dt;
      c.speed = Math.max(0, c.speed - 100 * dt);
      c.x += Math.cos(c.angle) * c.speed * dt;
      c.y += Math.sin(c.angle) * c.speed * dt;
      if (Math.hypot(c.x - p.x, c.y - p.y) > 900) G.cars.splice(G.cars.indexOf(c), 1);
    }
    return;
  }
  for (const c of active) {
    // Steer toward the player, ram when close.
    const wantAngle = Math.atan2(p.y - c.y, p.x - c.x);
    let diff = wantAngle - c.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    c.angle += Math.max(-2.6 * dt, Math.min(2.6 * dt, diff));
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    const target = d < 60 ? 480 : 420;
    c.speed += (target - c.speed) * Math.min(1, dt * 1.5);
    const nx = c.x + Math.cos(c.angle) * c.speed * dt;
    const ny = c.y + Math.sin(c.angle) * c.speed * dt;
    if (!G.city.collide(nx, ny, 20)) { c.x = nx; c.y = ny; }
    else { c.angle += Math.PI / 2 * dt * 4; c.speed *= 0.6; }
    if (d < 46) {
      if (p.car) {
        // Ram: damage the player's car and slow it.
        p.car.damage += 6 * dt * 10;
        p.car.speed *= 0.92;
        if (p.car.damage >= 100) { p.car.broken = true; G.toast('Your car broke down!'); }
        if (G.rng.next() < dt * 2) G.audio.crash();
      } else {
        G.busted();
      }
    }
  }
  // Decay: no crime recently and no police close by.
  const near = active.some((c) => Math.hypot(c.x - p.x, c.y - p.y) < 420);
  if (!near && G.time - p.lastCrime > 12) {
    p.decayTimer += dt;
    if (p.decayTimer > 8) {
      p.decayTimer = 0;
      if (p.wanted > 0) { p.wanted -= 1; G.toast('Heat is cooling off...'); }
    }
  } else p.decayTimer = 0;
}
