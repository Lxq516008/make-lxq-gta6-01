// Solmar Bay — tuning numbers, palette and world constants in one place.
export const STEP = 1 / 60;
export const WORLD = { w: 3200, h: 2400 };
export const ROAD_W = 96;
export const ROADS_X = [200, 600, 1000, 1400, 1800, 2200, 2600];
export const ROADS_Y = [200, 600, 1000, 1400, 1800, 2200];
export const BEACH_X = 2900;
export const OCEAN_X = 3060;
export const SAVE_KEY = 'solmar-bay-save-v1';

export const PLAYER = { walk: 170, run: 300, radius: 14, health: 100 };
export const CAR = { accel: 420, brake: 700, reverse: 220, maxSpeed: 560, maxReverse: 180, grip: 2.6 };

export const PALETTE = {
  grass: '#7fae5a', ground: '#8fae6b', road: '#3d3a38', roadLine: '#e8d44d',
  sidewalk: '#b9b2a4', sand: '#ecd9a0', ocean: '#2f7fb8', oceanDeep: '#1f5f92',
  building: ['#c96f4a', '#d9a441', '#7d9db5', '#b56a8a', '#8a7fb5', '#5f9e7a', '#c98a5a'],
  roof: '#5a4a3f', park: '#5d9e4e', tree: '#3e7d32', text: '#f5f1e6', muted: '#cfc8b8',
  hud: 'rgba(12,16,22,0.72)', accent: '#ffcf3f', danger: '#e5484d', police: '#2f6fd0',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const DISTRICTS = [
  { name: 'Palma Verde', x0: 0, y0: 0, x1: 1100, y1: 1100 },
  { name: 'Old Harbor', x0: 0, y0: 1100, x1: 1100, y1: 2400 },
  { name: 'Neon Row', x0: 1100, y0: 0, x1: 2100, y1: 1100 },
  { name: 'Coral Heights', x0: 2100, y0: 0, x1: 3200, y1: 2400 },
  { name: 'Marina Beach', x0: 2600, y0: 1100, x1: 3200, y1: 2400 },
];

export const CAR_COLORS = ['#d94f3d', '#3d7dd9', '#e8c33c', '#4caf6d', '#e8e4da', '#7a4fd0', '#22262b', '#e07a2e'];
export const CAR_TYPES = [
  { name: 'Sunchaser', max: 520, accel: 430 },
  { name: 'Bayliner', max: 430, accel: 360 },
  { name: 'Coral GT', max: 620, accel: 520 },
  { name: 'Palm Van', max: 380, accel: 300 },
  { name: 'Harbor Taxi', max: 460, accel: 380 },
];
