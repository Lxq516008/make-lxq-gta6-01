// The player: on foot (walk/run, punch) and in a car (enter/exit with E, steal any car),
// plus busted / wasted handling.
import { PLAYER } from './config.js';
import { carHitsCar, drivePlayerCar, addCrash } from './vehicles.js';
import { addWanted } from './police.js';

export function createPlayer(x, y) {
  return {
    x, y, angle: 0, health: PLAYER.health, money: 250, wanted: 0,
    car: null, onFoot: true, punching: false, punchTimer: 0, punchCooldown: 0,
    lastCrime: -999, decayTimer: 0, wantedFlash: 0, invuln: 0, moving: false,
  };
}

export function nearestCar(G, maxD) {
  let best = null, bd = maxD;
  for (const c of G.cars) {
    const d = Math.hypot(c.x - G.player.x, c.y - G.player.y);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

export function enterCar(G, car) {
  const p = G.player;
  if (car.kind === 'traffic' && car.driver) {
    car.driver = false;
    addWanted(G, 1, 'Car stolen! +1 star');
    G.toast('You stole a car! The driver ran off.');
    // Driver flees on foot.
    G.peds.push({ x: car.x + 30, y: car.y + 30, angle: 0, speed: 60, shirt: '#e8e4da', flee: 2, down: 0, target: null, panic: 1 });
  } else if (car.kind === 'parked' || car.kind === 'target') {
    addWanted(G, 1, 'Car stolen! +1 star');
    G.toast('You stole a parked car!');
  }
  car.kind = 'player';
  p.car = car;
  p.onFoot = false;
  p.x = car.x; p.y = car.y;
  G.audio.pickup();
}

export function exitCar(G) {
  const p = G.player;
  if (!p.car) return;
  const car = p.car;
  car.kind = 'parked';
  car.speed = 0;
  p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 34;
  p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 34;
  p.car = null;
  p.onFoot = true;
}

export function updatePlayer(G, dt, input, actions) {
  const p = G.player;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.wantedFlash > 0) p.wantedFlash -= dt;
  if (p.punchCooldown > 0) p.punchCooldown -= dt;
  p.punching = false;
  if (p.car) {
    drivePlayerCar(G, p.car, dt, input);
    p.x = p.car.x; p.y = p.car.y; p.angle = p.car.angle;
    p.moving = Math.abs(p.car.speed) > 20;
    // Car vs car collisions.
    for (const o of G.cars) {
      if (o === p.car) continue;
      if (carHitsCar(p.car, o)) {
        if (o.kind === 'police') addWanted(G, 1, 'You hit a police car! +1 star');
        else if (o.kind === 'traffic' && Math.abs(p.car.speed) > 200) G.audio.crash();
      }
    }
    if (actions & 2) exitCar(G); // ACTION_ENTER
    if (p.car && p.car.damage >= 100) p.car.broken = true;
  } else {
    const axis = input.axis();
    const speed = input.run() ? PLAYER.run : PLAYER.walk;
    p.moving = axis.x !== 0 || axis.y !== 0;
    if (p.moving) {
      p.angle = Math.atan2(axis.y, axis.x);
      const nx = p.x + axis.x * speed * dt;
      const ny = p.y + axis.y * speed * dt;
      if (!G.city.collide(nx, p.y, PLAYER.radius)) p.x = nx;
      if (!G.city.collide(p.x, ny, PLAYER.radius)) p.y = ny;
      if (p.x > 3060) p.x = 3060; // don't wade into the ocean
    }
    if (input.punch() && p.punchCooldown <= 0) {
      p.punching = true; p.punchTimer = 0.25; p.punchCooldown = 0.45;
      G.audio.punch();
      // Punch lands on a nearby pedestrian.
      for (const ped of G.peds) {
        if (ped.down > 0) continue;
        if (Math.hypot(ped.x - p.x, ped.y - p.y) < 46) {
          ped.down = 3;
          addWanted(G, 1, 'Assault! +1 star');
          G.toast('You knocked someone down!');
          break;
        }
      }
    }
    if (actions & 2) {
      const car = nearestCar(G, 70);
      if (car) enterCar(G, car);
      else G.toast('No car nearby — walk to one and press E.');
    }
  }
  if (p.health <= 0) G.wasted();
}
