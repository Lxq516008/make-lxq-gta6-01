// Traffic AI: cars drive the road grid, keep a lane, turn at intersections, stop for
// crashes ahead; parked cars wait on the roadside to be stolen.
import { ROADS_X, ROADS_Y, ROAD_W } from './config.js';
import { createCar } from './vehicles.js';

function laneOffset(dir) { return dir > 0 ? 22 : -22; }

export function spawnTraffic(G, n) {
  for (let i = 0; i < n; i += 1) {
    const vertical = G.rng.next() < 0.5;
    const dir = G.rng.next() < 0.5 ? 1 : -1;
    let car;
    if (vertical) {
      const rx = G.rng.pick(ROADS_X);
      car = createCar(rx + laneOffset(dir), G.rng.range(100, 2300), dir > 0 ? Math.PI / 2 : -Math.PI / 2, 'traffic', G.rng);
    } else {
      const ry = G.rng.pick(ROADS_Y);
      car = createCar(G.rng.range(100, 2800), ry + laneOffset(dir), dir > 0 ? 0 : Math.PI, 'traffic', G.rng);
    }
    car.speed = G.rng.range(140, 220);
    G.cars.push(car);
  }
}

export function spawnParked(G, n) {
  for (let i = 0; i < n; i += 1) {
    const vertical = G.rng.next() < 0.5;
    let car;
    if (vertical) {
      const rx = G.rng.pick(ROADS_X);
      car = createCar(rx + 34, G.rng.range(150, 2250), G.rng.next() < 0.5 ? Math.PI / 2 : -Math.PI / 2, 'parked', G.rng);
    } else {
      const ry = G.rng.pick(ROADS_Y);
      car = createCar(G.rng.range(150, 2750), ry + 34, G.rng.next() < 0.5 ? 0 : Math.PI, 'parked', G.rng);
    }
    car.driver = false;
    G.cars.push(car);
  }
}

function nearIntersection(car) {
  for (const rx of ROADS_X) for (const ry of ROADS_Y) {
    if (Math.abs(car.x - rx) < 26 && Math.abs(car.y - ry) < 26) return true;
  }
  return false;
}

export function updateTraffic(G, dt) {
  for (const car of G.cars) {
    if (car.kind !== 'traffic') continue;
    if (car.damage >= 100) { car.speed = 0; continue; }
    // Gentle speed toward cruise, slow if another car is right ahead.
    let target = 190;
    for (const o of G.cars) {
      if (o === car) continue;
      const dx = o.x - car.x, dy = o.y - car.y;
      const ahead = dx * Math.cos(car.angle) + dy * Math.sin(car.angle);
      if (ahead > 0 && ahead < 70 && Math.abs(-dx * Math.sin(car.angle) + dy * Math.cos(car.angle)) < 26) target = 0;
    }
    car.speed += (target - car.speed) * Math.min(1, dt * 1.2);
    // Turn at intersections sometimes; otherwise stay on the current road.
    if (nearIntersection(car) && !car.turned && G.rng.next() < dt * 1.4) {
      car.turned = true;
      const vertical = Math.abs(Math.sin(car.angle)) > 0.7;
      const turn = G.rng.pick([-Math.PI / 2, 0, Math.PI / 2]);
      car.angle += turn;
      // Snap onto the new road's lane.
      if (vertical) {
        const ry = ROADS_Y.reduce((a, b) => Math.abs(b - car.y) < Math.abs(a - car.y) ? b : a);
        car.y = ry + laneOffset(Math.cos(car.angle) > 0 ? 1 : -1) * (Math.abs(Math.cos(car.angle)) > 0.7 ? 1 : 0);
        if (Math.abs(Math.cos(car.angle)) > 0.7) car.y = ry + (Math.cos(car.angle) > 0 ? 22 : -22);
      } else {
        const rx = ROADS_X.reduce((a, b) => Math.abs(b - car.x) < Math.abs(a - car.x) ? b : a);
        if (Math.abs(Math.sin(car.angle)) > 0.7) car.x = rx + (Math.sin(car.angle) > 0 ? 22 : -22);
      }
    } else if (!nearIntersection(car)) car.turned = false;
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    if (!G.city.collide(nx, ny, 20) && nx > 60 && nx < 2880 && ny > 60 && ny < 2340) {
      car.x = nx; car.y = ny;
    } else {
      // Hit the map edge or a building: turn around.
      car.angle += Math.PI;
    }
  }
  // Keep traffic topped up near the player.
  const traffic = G.cars.filter((c) => c.kind === 'traffic').length;
  if (traffic < 8 && G.rng.next() < dt * 0.5) spawnTraffic(G, 1);
}
