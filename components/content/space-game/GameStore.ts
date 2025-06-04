import { reactive } from 'vue'
import type { PerspectiveCamera } from 'three'
import { Clock, Object3D, Ray, Box3, TubeGeometry, Vector2, Vector3 } from 'three'

import { POINTS_OF_INTEREST } from './store/constants'
import { timeManager } from './store/TimeManager'
import { SpeedMode } from './store/constants'
import { WiderGrannyKnot } from './store/utils'
import {
  generateRings,
  generateChainweb3D,
  generatePetersenGraph,
  generateInfoLabels,
  generateSpaceStationData,
  generateSpaceProbeData,
} from './store/generators'

import type {
  ExplosionData,
  ObjectData,
  ScoreNotification,
  ComboSystem,
  ModalState,
  GameActions,
} from './store/types'

import type { AudioSystem } from './utils/types'

const spline = new WiderGrannyKnot()
const tk = new TubeGeometry(spline, 200, 0.15, 10, true)
const guid = 0

// Create empty default actions that will be replaced during initialization
const createDefaultActions = (): GameActions => ({
  init: () => { console.warn('Game actions not initialized yet') },
  update: () => { console.warn('Game actions not initialized yet') },
  startGame: () => { console.warn('Game actions not initialized yet') },
  toggleSound: () => { console.warn('Game actions not initialized yet') },
  toggleInfoText: () => { console.warn('Game actions not initialized yet') },
  showModal: () => { console.warn('Game actions not initialized yet') },
  hideModal: () => { console.warn('Game actions not initialized yet') },
  shoot: () => { console.warn('Game actions not initialized yet') },
  test: () => false,
  registerHit: () => { console.warn('Game actions not initialized yet') },
  addScoreNotification: () => { console.warn('Game actions not initialized yet') },
  addStardust: () => { console.warn('Game actions not initialized yet') },
  switchGameMode: () => { console.warn('Game actions not initialized yet') },
  switchSpeedMode: () => { console.warn('Game actions not initialized yet') },
})

export const gameStore = reactive({
  // Core game objects
  spline,
  guid,

  // Game state data
  battleScore: 0,
  stardust: 0,
  loopCount: 0,
  totalLoops: 7, // total game loops

  // Game entities
  lasers: [] as number[],
  explosions: [] as ExplosionData[],
  initialRockCount: 0,
  initialEnemyCount: 0,
  rocks: [] as ObjectData[],
  enemies: [] as ObjectData[],

  // World objects - generated once and reused
  rings: generateRings(40, tk),
  chainweb3D: generateChainweb3D(30, tk),
  PetersenGraphGroup: generatePetersenGraph(tk),
  infoLabels: generateInfoLabels(tk),
  spaceStation: generateSpaceStationData(tk),
  spaceProbe: generateSpaceProbeData(tk),

  // System components
  camera: null as PerspectiveCamera | null,
  sound: false,
  showInfoText: true, // state to control text visibility
  speedMode: SpeedMode.Fast, // Default to Fast mode
  particlesCount: 50, // Default particle count

  // UI state
  modal: {
    show: false,
    type: '' as ModalState['type'], // type of modal to show
  } as ModalState,

  // Time management
  timeManager,

  // Observation state - simplified
  currentPointOfInterest: null as keyof typeof POINTS_OF_INTEREST | null,
  observedPoints: [] as string[], // previously observed points
  orbitAngle: 0,
  orbitHeight: 0,

  // Combat system
  comboSystem: {
    count: 0,
    lastHitTime: 0,
    timeWindow: 2000,
    active: false,
    resetTimer: 0 as unknown as ReturnType<typeof setTimeout>,
  } as ComboSystem,

  // Audio system
  audioSystem: null as AudioSystem | null,
  audioError: false,

  // UI notifications
  scoreNotifications: [] as ScoreNotification[],

  // Core mutation state
  mutation: {
    // Position and time
    t: 0,
    lastT: 0,
    position: new Vector3(),
    startTime: Date.now(),
    observationStartTime: 0,

    // Track configuration
    track: tk,
    scale: 15,
    fov: 70,
    hits: 0,

    // Dynamic entities
    particles: [] as ObjectData[],
    looptime: 40 * 1000, // default to fast mode
    binormal: new Vector3(),
    normal: new Vector3(),
    clock: new Clock(false),
    mouse: new Vector2(0, 0), 

    // Re-usable objects for performance
    dummy: new Object3D(),
    ray: new Ray(),
    box: new Box3(),

    // Cleanup timers
    cancelExplosionTO: setTimeout(() => { }, 1),
    cancelLaserTO: setTimeout(() => { }, 1),

    // Orbit control properties for observation mode
    orbitCenter: new Vector3(),
    orbitTarget: new Vector3(),
    orbitDistance: 70,
    orbitSpeed: 0.001,
    previousPosition: new Vector3(),
    previousTime: Date.now(),
    pausedTime: 0,
    isPaused: false,
  },

  // Actions interface - initialized with placeholders that will be replaced
  actions: createDefaultActions(),
})

export type GameStore = typeof gameStore