// Solmar Bay map: road grid, building blocks, a park, a beach and ocean on the east edge,
// a marina on the south-east. All names and layout are original.
import { BEACH_X, DISTRICTS, OCEAN_X, PALETTE, ROADS_X, ROADS_Y, ROAD_W, WORLD } from './config.js';

export function districtAt(x, y) {
  for (const d of DISTRICTS) if (x >= d.x0 && x < d.x1 && y >= d.y0 && y < d.y1) return d.name;
  return 'Solmar Bay';
}

export function createCity(rng) {
  const buildings = [];
  const trees = [];
  const park = { x: 1060, y: 1060, w: 280, h: 280 };
  // Blocks are the cells between neighbouring roads.
  const xs = [0, ...ROADS_X, WORLD.w];
  const ys = [0, ...ROADS_Y, WORLD.h];
  for (let bi = 0; bi < xs.length - 1; bi += 1) {
    for (let bj = 0; bj < ys.length - 1; bj += 1) {
      const x0 = xs[bi] + (bi === 0 ? 20 : ROAD_W / 2 + 14);
      const x1 = xs[bi + 1] - (bi === xs.length - 2 ? 20 : ROAD_W / 2 + 14);
      const y0 = ys[bj] + (bj === 0 ? 20 : ROAD_W / 2 + 14);
      const y1 = ys[bj + 1] - (bj === ys.length - 2 ? 20 : ROAD_W / 2 + 14);
      if (x1 - x0 < 90 || y1 - y0 < 90) continue;
      if (x0 > BEACH_X - 60) continue; // beach strip stays open
      // Park block: trees and a pond instead of buildings.
      if (x0 >= park.x - 40 && x0 < park.x + park.w && y0 >= park.y - 40 && y0 < park.y + park.h) {
        for (let t = 0; t < 14; t += 1) trees.push({ x: rng.range(x0 + 20, x1 - 20), y: rng.range(y0 + 20, y1 - 20), r: rng.range(10, 16) });
        continue;
      }
      // Marina block (south-east, by the water): low sheds, no tall towers.
      const marina = x0 > 2400 && y0 > 1900;
      const count = marina ? 2 : rng.int(1, 3);
      for (let n = 0; n < count; n += 1) {
        const w = marina ? rng.range(90, 150) : rng.range(90, 190);
        const h = marina ? rng.range(50, 80) : rng.range(80, 170);
        const bx = rng.range(x0, Math.max(x0 + 1, x1 - w));
        const by = rng.range(y0, Math.max(y0 + 1, y1 - h));
        const b = { x: bx, y: by, w, h, color: rng.pick(PALETTE.building), tall: !marina && rng.next() < 0.35, ac: rng.int(0, 3) };
        if (buildings.some((o) => o.x < b.x + b.w + 16 && o.x + o.w + 16 > b.x && o.y < b.y + b.h + 16 && o.y + o.h + 16 > b.y)) continue;
        buildings.push(b);
      }
      if (rng.next() < 0.7) trees.push({ x: rng.range(x0 + 10, x1 - 10), y: rng.range(y0 + 10, y1 - 10), r: rng.range(9, 14) });
    }
  }
  const onRoadX = (x) => ROADS_X.some((rx) => Math.abs(x - rx) < ROAD_W / 2);
  const onRoadY = (y) => ROADS_Y.some((ry) => Math.abs(y - ry) < ROAD_W / 2);
  function hitsBuilding(x, y, r) {
    for (const b of buildings) {
      if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return b;
    }
    return null;
  }
  return {
    buildings, trees, park, W: WORLD.w, H: WORLD.h,
    isRoad(x, y) { return onRoadX(x) || onRoadY(y); },
    // Circle vs buildings / world edge / deep ocean. Returns the building hit or null.
    collide(x, y, r) {
      if (x < r || y < r || x > WORLD.w - r || y > WORLD.h - r) return { edge: true };
      if (x > OCEAN_X) return { edge: true };
      return hitsBuilding(x, y, r);
    },
    resolveCircle(ent, r) {
      // Push a circle out of a building it overlaps; returns true if it hit something.
      const b = hitsBuilding(ent.x, ent.y, r);
      if (!b) return false;
      const cx = Math.max(b.x, Math.min(ent.x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(ent.y, b.y + b.h));
      let dx = ent.x - cx, dy = ent.y - cy;
      const d = Math.hypot(dx, dy);
      if (d === 0) { ent.x = b.x - r - 1; return true; }
      dx /= d; dy /= d;
      ent.x = cx + dx * (r + 1); ent.y = cy + dy * (r + 1);
      return true;
    },
    randomRoadPoint() {
      if (rng.next() < 0.5) return { x: rng.pick(ROADS_X), y: rng.range(120, WORLD.h - 120) };
      return { x: rng.range(120, BEACH_X - 120), y: rng.pick(ROADS_Y) };
    },
    nearestRoadPoint(x, y) {
      let best = null, bd = Infinity;
      for (const rx of ROADS_X) for (const ry of ROADS_Y) {
        const d = Math.hypot(x - rx, y - ry);
        if (d < bd) { bd = d; best = { x: rx, y: ry }; }
      }
      return best;
    },
  };
}
