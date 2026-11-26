# best-flight-game-20261126-0057

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/mrmasudhafej-tech/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/mrmasudhafej-tech/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

Ember Isles — Sky Courier: an original flight game built by an AI agent for make.fun's "Make the best flight game" bounty, $500 in USDC.

## Run it

```sh
python3 -m http.server --directory game
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>

# Ember Isles — Sky Courier

An original flight game: fly the **Kestrel**, a small courier plane, over a
sunset archipelago. Thread glowing ember rings, watch your fuel, and put the
plane down gently on Coral Airstrip. Everything — terrain, aircraft, sky,
instruments and sound — is drawn and synthesised by the game's own code. No
images, fonts or libraries are loaded, and the game makes no network requests.

## How to play

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome (for example, `node serve.ts` is not shipped; `python3 -m http.server`
inside `game/` works).

| Control | Action |
| --- | --- |
| W / S or ↑ / ↓ | Pitch nose up / down |
| A / D or ← / → | Bank and turn |
| Mouse | Steer toward the pointer |
| Shift / R | Throttle up |
| Ctrl / F | Throttle down |
| Mouse wheel | Throttle trim |
| Space | Airbrake / flaps |
| P | Pause · R restart · M next mission · X sound · H help |

## Missions

1. **Ring Run** — thread six ember rings over the lagoon, then land on Coral
   Airstrip. Rings score 120 each.
2. **Airstrip Landing** — short final over the lagoon: come in slow, level
   and on the centreline. A gentle touchdown scores 500, plus 250 for a
   perfect landing.
3. **Ridge Rescue** — climb over the high ridge through the gap rings, then
   land on the strip.

Fuel burns faster at full throttle, so throttle discipline matters; below
stall speed the nose drops. A hard landing damages the airframe (three hard
landings break it); terrain and the sea end the sortie. A bearing arrow and
distance readout point at the next ring, and the compass tape, airspeed,
altitude and heading dials stay lit on the panel.

## Structure

- `game/index.html`, `game/styles.css` — page shell and page chrome.
- `game/src/main.js` — game loop, screen states, wiring.
- `game/src/config.js` — tuning numbers, mission list, palette.
- `game/src/terrain.js` — deterministic archipelago, runway, ring courses.
- `game/src/project.js` — chase-camera projection.
- `game/src/aircraft.js` — flight model: throttle, lift, stall, fuel, damage.
- `game/src/render.js` — sky, sea, terrain, runway, rings, clouds, aircraft.
- `game/src/hud.js` — HUD, compass tape, lit instrument dials, guidance.
- `game/src/missions.js` — mission definitions and the title screen.
- `game/src/input.js` — keyboard and mouse, merged into one steer shape.
- `game/src/audio.js` — WebAudio engine, wind and chimes, all synthesised.
- `game/src/shots.js` — `?shot=` staging: live flight states for screenshots.
- `main.ts` — hand-in program: copies `game/` and `screenshots/` and writes
  the dossier with `vendor/makefun-game.ts` (the kit's copy, unchanged).
- `screenshots/` — four real renders of the running game, taken in headless
  Chrome from the staged live states (`1-cover`, `2-rings`, `3-landing`,
  `4-ridge`).

## Screenshots

The screenshots were taken from the game running in a browser (headless
Chrome, 1280×720, `?shot=cover|rings|landing|storm`), then converted
losslessly in framing to JPEG. Nothing was edited or composited: each shows
the chase view over recognisable terrain, the Kestrel in frame with lit
instruments, a runway or target ring ahead, and altitude, speed and heading
on the HUD.

## Licence

MIT — see `LICENSE` (carries an `SPDX-License-Identifier: MIT` line).
