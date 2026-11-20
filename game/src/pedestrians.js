// Pedestrians: walk the sidewalks, cross at corners, flee from danger (speeding cars,
// punches, gunfire-free chaos), and panic when a car comes at them.
import { ROADS_X, ROADS_Y } from './config.js';

const SHIRTS = ['#e8e4da', '#d94f3d', '#3d7dd9', '#4caf6d', '#e8c33c', '#7a4fd0', '#e07a2e'];

export function spawnPeds(G, n) {
  for (let i = 0; i < n; i += 1) {
    const p = G.city.randomRoadPoint();
    G.peds.push({
      x: p.x + G.rng.range(-50, 50), y: p.y + G.rng.range(-50, 50),
      angle: G.rng.range(0, Math.PI * 2), speed: G.rng.range(40, 70),
      shirt: G.rng.pick(SHIRTS), flee: 0, down: 0, target: null, panic: 0,
    });
  }
}

export function updatePeds(G, dt) {
  const px = G.player.x, py = G.player.y;
  const car = G.player.car;
  for (const p of G.peds) {
    if (p.down > 0) { p.down -= dt; continue; }
    // Danger: player car nearby and fast, or player punching close by.
    let danger = 0;
    if (car && Math.abs(car.speed) > 120) {
      const d = Math.hypot(p.x - car.x, p.y - car.y);
      if (d < 220) danger = 220 - d;
    }
    const pd = Math.hypot(p.x - px, p.y - py);
    if (pd < 60 && G.player.punching) danger = 120;
    if (danger > 0) {
      p.flee = 1.2; p.panic = 1;
      p.angle = Math.atan2(p.y - (car ? car.y : py), p.x - (car ? car.x : px));
    }
    if (p.flee > 0) {
      p.flee -= dt;
      p.x += Math.cos(p.angle) * 190 * dt;
      p.y += Math.sin(p.angle) * 190 * dt;
    } else {
      // Stroll along the nearest road, turning at intersections.
      if (!p.target || Math.hypot(p.x - p.target.x, p.y - p.target.y) < 30) {
        const rx = ROADS_X.reduce((a, b) => Math.abs(b - p.x) < Math.abs(a - p.x) ? b : a);
        const ry = ROADS_Y.reduce((a, b) => Math.abs(b - p.y) < Math.abs(a - p.y) ? b : a);
        if (G.rng.next() < 0.5) p.target = { x: rx + G.rng.pick([-58, 58]), y: p.y + G.rng.pick([-1, 1]) * G.rng.range(80, 300) };
        else p.target = { x: p.x + G.rng.pick([-1, 1]) * G.rng.range(80, 300), y: ry + G.rng.pick([-58, 58]) };
      }
      p.angle = Math.atan2(p.target.y - p.y, p.target.x - p.x);
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
    }
    p.x = Math.max(30, Math.min(2890, p.x));
    p.y = Math.max(30, Math.min(2370, p.y));
    G.city.resolveCircle(p, 10);
    // Hit by the player's car: knocked down, wanted rises.
    if (car && Math.abs(car.speed) > 60 && Math.hypot(p.x - car.x, p.y - car.y) < 30 && p.down <= 0) {
      p.down = 4;
      G.audio.crash();
      G.addWanted(1, 'Pedestrian hit');
      G.toast('You hit a pedestrian! +1 star');
    }
  }
  if (G.peds.length < 16 && G.rng.next() < dt * 0.4) spawnPeds(G, 1);
}
