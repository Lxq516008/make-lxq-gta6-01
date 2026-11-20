// Deterministic screenshot scenes behind ?shot=drive|foot|chase|mission|title&seed=N.
// Each one stages a fixed scene from the real rules and skips the title screen.
import { MISSIONS, startMission } from './missions.js';
import { createCar } from './vehicles.js';
import { spawnPolice } from './police.js';
import { enterCar } from './player.js';

export function stageShot(G, name) {
  G.screen = 'play';
  const p = G.player;
  if (name === 'title') { G.screen = 'title'; return; }
  if (name === 'foot') {
    // On foot on Neon Row, busy street: traffic passing, peds on the sidewalk.
    p.x = 1400; p.y = 600; p.angle = 0; p.onFoot = true; p.car = null;
    p.money = 1250; p.health = 92;
    G.camera.x = p.x; G.camera.y = p.y; G.camera.zoom = 1;
    return;
  }
  if (name === 'drive') {
    // Driving down the beach road in Coral Heights.
    const car = createCar(2600, 1400, 0, 'player', G.rng);
    G.cars.push(car);
    p.car = car; p.onFoot = false; p.x = car.x; p.y = car.y;
    car.speed = 300;
    p.money = 1250;
    G.camera.x = p.x; G.camera.y = p.y; G.camera.zoom = 0.8;
    return;
  }
  if (name === 'chase') {
    // Police chase: 3 stars, three police cars closing in on the player's car.
    const car = createCar(1800, 1000, 0, 'player', G.rng);
    car.color = '#d94f3d';
    G.cars.push(car);
    p.car = car; p.onFoot = false; p.x = car.x; p.y = car.y;
    car.speed = 380;
    p.wanted = 3; p.lastCrime = G.time;
    p.money = 2100; p.health = 78;
    for (let i = 0; i < 3; i += 1) {
      const pc = createCar(car.x - 180 - i * 90, car.y + (i - 1) * 60, 0, 'police', G.rng);
      pc.speed = 420;
      G.cars.push(pc);
    }
    G.camera.x = p.x; G.camera.y = p.y; G.camera.zoom = 0.8;
    return;
  }
  if (name === 'mission') {
    // Mission 2 (Bay Courier) in progress, with timer and waypoint.
    startMission(G, 1);
    const car = createCar(1400, 1000, Math.PI / 2, 'player', G.rng);
    G.cars.push(car);
    p.car = car; p.onFoot = false; p.x = car.x; p.y = car.y;
    car.speed = 220;
    p.money = 1600;
    G.mission.timer = 82;
    G.camera.x = p.x; G.camera.y = p.y; G.camera.zoom = 0.85;
    return;
  }
  // Default: foot scene.
  p.x = 1000; p.y = 1000;
  G.camera.x = p.x; G.camera.y = p.y;
}
