export enum SpeedMode {
  Slow = 'Slow',
  Normal = 'Normal',
  Fast = 'Fast',
}

export enum ModalType {
  GAME_OVER = 'gameOver',
  SWITCH_CONFIRM = 'switchConfirm'
}

export const SCORE_VALUES = {
  ENEMY: 150, // 150 points per enemy
  ROCK: 10, // 10 points per rock
  COMBO_THRESHOLD_SMALL: 3, // Small combo threshold
  COMBO_THRESHOLD_LARGE: 5, // Large combo threshold  
  COMBO_BONUS_SMALL: 25, // Small combo multiplier
  COMBO_BONUS_LARGE: 50, // Large combo multiplier
  ALL_ENEMIES_BONUS: 800, // Bonus for destroying all enemies
  ALL_ROCKS_BONUS: 1500, // Bonus for destroying all rocks
}

export const TRACK_POSITIONS = {
  START: 0,
  PETERSEN_GRAPH: [0.1, 0.25, 0.55, 0.955],
  Chainweb3D: 0.4,
  WARP_BEGIN: 0.3,
  WARP_END: 0.4,
  WARP_RESET: 0.5,
  RINGS: 0.65,
  SPACE_STATION: 0.79,
  SPACE_PROBE: 0.86,
  LOOP: 1.0,
}

export const INFO_LABELS = [
  { t: 0.095, text: 'Petersen Graph', color: '#4286f4' }, // Softer blue to match the space environment
  { t: 0.245, text: 'Graph Theory', color: '#c67eff' }, // Softer purple that harmonizes with stars
  { t: 0.545, text: 'Scalable Structure', color: '#4286f4' }, // Matching blue
  { t: 0.95, text: 'Remarkable Configuration', color: '#c67eff' }, // Matching purple
  { t: 0.395, text: 'Chainweb', color: '#e6c86e' }, // Warmer, less saturated gold
  { t: 0.45, text: 'Blockchain', color: '#e6c86e' }, // Matching gold
  { t: 0.49, text: 'Kadena', color: '#e6c86e' }, // Matching gold
  { t: 0.64, text: '3D Visual', color: '#7CFC00' }, // Match track color in exploration mode
  { t: 0.7, text: 'Vootaa Lab', color: '#e38846' }, // Warmer orange to match track in battle mode
  { t: 0.78, text: 'Space Station', color: '#9f7bea' }, // Softer purple variant
  { t: 0.85, text: 'Space Probe', color: '#9f7bea' }, // Same purple for consistency
  { t: 0.98, text: 'Welcome to', color: '#20B2AA' }, // Keep this teal to match observation mode track
  { t: 0.99, text: 'Explore Journey', color: '#20B2AA' }, // Matching teal
]

// Define points of interest for observation
export const POINTS_OF_INTEREST = {
  PETERSEN_GRAPH: {
    name: 'Petersen Graph',
    trackPosition: TRACK_POSITIONS.PETERSEN_GRAPH[0],
    orbitDistance: 50,
    orbitSpeed: 0.002,
  },
  CHAINWEB_3D: {
    name: 'Chainweb 3D',
    trackPosition: TRACK_POSITIONS.Chainweb3D,
    orbitDistance: 120,
    orbitSpeed: 0.0015,
  },
  SPACE_STATION: {
    name: 'Space Station',
    trackPosition: TRACK_POSITIONS.SPACE_STATION,
    orbitDistance: 80,
    orbitSpeed: 0.001,
  },
  SPACE_PROBE: {
    name: 'Space Probe',
    trackPosition: TRACK_POSITIONS.SPACE_PROBE,
    orbitDistance: 100,
    orbitSpeed: 0.001,
  },
}

export const SPEED_SETTINGS = {
  [SpeedMode.Slow]: {
    looptime: 80 * 1000,
    label: 'SLOW',
    factor: 0.5,
  },
  [SpeedMode.Normal]: {
    looptime: 60 * 1000,
    label: 'NORMAL',
    factor: 1.0,
  },
  [SpeedMode.Fast]: {
    looptime: 40 * 1000,
    label: 'FAST',
    factor: 1.5,
  },
}