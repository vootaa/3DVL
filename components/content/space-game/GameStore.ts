import { reactive } from 'vue'
import type { PerspectiveCamera } from 'three'
import { Clock, Object3D, Ray, Box3, TubeGeometry, Vector2, Vector3 } from 'three'

import { timeManager } from './store/TimeManager'
import type { POINTS_OF_INTEREST } from './store/constants'
import { GameMode, ObservationMode, SpeedMode } from './store/constants'
import { WiderGrannyKnot } from './store/utils'
import { 
  generateRings, 
  generateChainweb3D, 
  generatePetersenGraph, 
  generateInfoLabels, 
  generateSpaceStationData, 
  generateSpaceProbeData,
} from './store/generators'

import type { ExplosionData } from './store/types'

import type { AudioSystem } from './utils/audio'

const spline = new WiderGrannyKnot()
const tk = new TubeGeometry(spline, 200, 0.15, 10, true)
const guid = 0

export const gameStore = reactive({
  spline,
  guid,
  battleScore: 0,
  stardust: 0,
  loopCount: 0,
  totalLoops: 7, // total game loops
  lasers: [] as number[],
  explosions: [] as ExplosionData[],
  initialRockCount: 0,
  initialEnemyCount: 0,
  rocks: [],
  enemies: [],
  rings: generateRings(40, tk),
  chainweb3D: generateChainweb3D(30, tk),
  PetersenGraphGroup: generatePetersenGraph(tk),
  infoLabels: generateInfoLabels(tk),
  spaceStation: generateSpaceStationData(tk),
  spaceProbe: generateSpaceProbeData(tk),
  camera: null,
  sound: false,
  showInfoText: true, // state to control text visibility
  gameMode: GameMode.None, // Default to None mode
  speedMode: SpeedMode.Fast, // Default to Fast mode
  modal: {
    show: false,
    type: '', // 'gameOver' or 'switchConfirm'
  },
  timeManager,
  observationMode: ObservationMode.None,
  currentPointOfInterest: null as keyof typeof POINTS_OF_INTEREST | null,
  observedPoints: [] as string[], // previously observed points
  orbitAngle: 0,
  orbitHeight: 0,
  comboSystem: {
    count: 0,
    lastHitTime: 0,
    timeWindow: 2000, // 2 seconds for combo counting
    active: false,
    resetTimer: 0 as unknown as ReturnType<typeof setTimeout>,
  },
  audioSystem: undefined as AudioSystem | undefined,
  audioError: false,
  scoreNotifications: [] as Array<{
    id: number
    text: string
    points: number
    isBonus?: boolean
    timestamp: number
  }>,
  mutation: {
    t: 0,
    lastT: 0,
    position: new Vector3(),
    startTime: Date.now(),
    observationStartTime: 0,

    track: tk,
    scale: 15,
    fov: 70,
    hits: 0,

    particles: [],
    looptime: 40 * 1000, // default to fast mode
    binormal: new Vector3(),
    normal: new Vector3(),
    clock: new Clock(false),
    mouse: new Vector2(0, 0), 

    // Re-usable objects
    dummy: new Object3D(),
    ray: new Ray(),
    box: new Box3(),

    cancelExplosionTO: setTimeout(() => { }, 1),
    cancelLaserTO: setTimeout(() => { }, 1),

    // Add orbit control properties
    orbitCenter: new Vector3(),
    orbitTarget: new Vector3(),
    orbitDistance: 70,
    orbitSpeed: 0.001,
    previousPosition: new Vector3(),
    previousTime: Date.now(),
    pausedTime: 0,
    isPaused: false,
  },

  actions: {
    toggleSound: null as unknown as (sound?: boolean) => void,
    toggleInfoText: null as unknown as (show?: boolean) => void,
    shoot: null as unknown as () => void,
    test: null as unknown as (data: {
      size: number
      offset: Vector3
      scale: number
      hit: any
      distance: number
    }) => boolean,
    updateMouse: null as unknown as (mouse: { clientX: number; clientY: number }) => void,
    init: null as unknown as (camera: PerspectiveCamera) => void,
    update: null as unknown as () => void,
    switchGameMode: null as unknown as () => void,
    switchSpeedMode: null as unknown as () => void,
    toggleObservationMode: null as unknown as (pointOfInterestKey: keyof typeof POINTS_OF_INTEREST | null) => void,
    updateOrbitPosition: null as unknown as (horizontalAngle: number, verticalAngle: number) => void,
    resumeJourney: null as unknown as () => void,
    registerHit: null as unknown as (count: number, type: 'rock' | 'enemy') => void,
    addScoreNotification: null as unknown as (text: string, points: number, isBonus: boolean) => void,
    startGame: null as unknown as (switchMode: boolean) => void,
    showModal: null as unknown as (type: string) => void,
    hideModal: null as unknown as () => void,
    addStardust: null as unknown as () => void,
  },
})

export type GameStore = typeof gameStore