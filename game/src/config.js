// Ember Isles tuning: every number that shapes how the Kestrel flies lives here,
// so the flight model in aircraft.js and the missions in missions.js stay readable.
export const CONFIG = {
  // World: the airstrip island sits at the origin; the sea is y = 0.
  seaLevel: 0,
  gravity: 9.8,
  // Flight model (units are game units; 1 unit ~ 1 m for HUD-feel purposes).
  minFlySpeed: 26,
  cruiseSpeed: 62,
  maxSpeed: 118,
  stallSpeed: 24,
  throttleAccel: 26,
  drag: 0.16,
  liftFactor: 0.55,
  pitchRate: 1.15,
  rollRate: 2.1,
  turnRate: 0.62,
  climbPenalty: 0.9,
  // Camera: chase camera behind and above the aircraft.
  cameraDistance: 13,
  cameraHeight: 4.2,
  focalLength: 520,
  // Terrain rendering.
  terrainRows: 30,
  terrainCols: 26,
  terrainDepth: 1500,
  terrainWidth: 1100,
  fogDistance: 1450,
  // Fuel and damage: a sortie is a set of decisions, not an endless joyride.
  fuelCapacity: 100,
  fuelBurnIdle: 0.55,
  fuelBurnFull: 2.4,
  damagePerHardLanding: 34,
  crashDamage: 100,
  // Scoring.
  ringScore: 120,
  landingScore: 500,
  perfectLandingBonus: 250,
  timeBonusPerSecond: 2,
  // Screenshot staging: ?shot=cover|rings|landing|storm
  shotDefaults: {
    cover: { mission: 'ring-run' },
    rings: { mission: 'ring-run' },
    landing: { mission: 'airstrip-landing' },
    storm: { mission: 'ridge-rescue' },
  },
};

export const MISSIONS = [
  {
    id: 'ring-run',
    name: 'Ring Run',
    blurb: 'Thread six ember rings, then land on Coral Airstrip.',
    goal: 'Fly through 6 rings, then land on the runway.',
  },
  {
    id: 'airstrip-landing',
    name: 'Airstrip Landing',
    blurb: 'Short final: come in slow, level, on the centreline.',
    goal: 'Land gently on Coral Airstrip with the wheels down the centre.',
  },
  {
    id: 'ridge-rescue',
    name: 'Ridge Rescue',
    blurb: 'Cross the high ridge through the gap, then land.',
    goal: 'Pass the ridge gap ring, then land on Coral Airstrip.',
  },
];

// Original palette: one sunset style shared by sky, sea, terrain and instruments.
export const PALETTE = {
  skyTop: '#1d3a5f',
  skyMid: '#e8824a',
  skyHorizon: '#f7c873',
  sunCore: '#fff3c4',
  seaDeep: '#173e52',
  seaShallow: '#2e7d8c',
  sand: '#e8c98a',
  grass: '#5d8f4e',
  forest: '#3c6b3a',
  rock: '#7a6a5e',
  snow: '#f2ede2',
  runway: '#3a3f46',
  ring: '#ffb347',
  panel: '#10151c',
  panelEdge: '#2c3947',
  gaugeFace: '#0d1b24',
  gaugeLit: '#ffe9a8',
  needle: '#ff5a3c',
};
