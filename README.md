# Solmar Bay

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Lxq516008/make-lxq-gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Lxq516008/make-lxq-gta6-01/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An open-world crime game set in **Solmar Bay**, a sun-soaked fictional coastal city. You are Rio Solano, a driver new in town, working your way up fixer Mara Voss's crew. Explore four districts — Palma Verde, Old Harbor, Neon Row and Coral Heights — plus a park, a marina and a beach with an animated ocean.

## What is in the game

- **A living city**: a road grid with traffic that drives it, pedestrians who stroll the sidewalks and flee from danger, parked cars, a park, a beach and a marina.
- **On foot and by car**: walk, run and punch on foot (WASD/arrows, Shift to run, Space to punch, E to enter a car); drive with arcade physics, handbrake drifts, skid marks, dust and crash particles (W/S accelerate and brake, A/D steer, Space handbrake). Cars take damage and can break down.
- **Steal any car**: take a parked car or pull a driver out of a traffic car — the driver flees, and the theft raises your wanted level.
- **Wanted system (0–5 stars)**: stealing cars, hitting pedestrians and ramming police cars raise the heat. Police cars spawn and chase and ram you. Get caught on foot and you are **BUSTED** (−$100); lose all your health and you are **WASTED** and wake up at Coral General Hospital (−$150). Lay low out of sight and the heat cools off.
- **Six story missions** with original characters (Mara Voss, Delia Cruz, Tomas Reyes): steal and deliver a car, a timed courier run, taxi fares, losing a 3-star wanted level, stealing a guarded Coral GT, and a finale heist chain. Each has an objective banner, a waypoint arrow and minimap marker, a timer where it applies, and a cash reward.
- **HUD and menus**: health bar, money, wanted stars, minimap (roads, you, police, mission marker), speedometer while driving, toasts, a start screen (Continue / New Game / Missions / Controls / sound), pause (Esc/P), and saves to localStorage (money, missions, settings).
- **Sound, all synthesized**: engine hum, police sirens, pickup blips, crash thuds and a mission jingle, made with WebAudio. M mutes.
- **Deterministic screenshots**: `?shot=drive|foot|chase|mission|title&seed=N` stages a fixed scene and skips the title screen, so every screenshot is reproducible.

## How to run

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no libraries, no network requests — everything is vanilla JavaScript and canvas art drawn in code.

## Controls

| | |
| --- | --- |
| On foot | WASD / arrows move · Shift run · Space punch · E enter a car |
| Driving | W accelerate · S brake / reverse · A/D steer · Space handbrake · E get out |
| General | N start the next mission · M mute · Esc / P pause |

## Tech

Vanilla JS ES modules under `game/src/` (one clear job per file: city, vehicles, traffic, pedestrians, police, player, missions, HUD, save, shots, render), a 2D canvas renderer, seeded RNG for the city layout and screenshot scenes, and WebAudio for sound. All art is drawn procedurally on canvas; all names, characters, story and art are original.

<sub>Entered on [make.fun](https://make.fun/?ref=a0pz932n&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
