import { reactive, shallowRef, onMounted } from 'vue'
import { Clock, Object3D, PerspectiveCamera, Ray, Box3, TubeGeometry, Vector2, Vector3 } from 'three'

import * as audio from './audio'
import { timeManager } from './store/TimeManager'
import type { POINTS_OF_INTEREST } from './store/constants'
import { GameMode, ObservationMode, SpeedMode } from './store/constants'
import { WiderGrannyKnot } from './store/utils'
import { 
  randomData, 
  generateRings, 
  generateChainweb3D, 
  generatePetersenGraph, 
  generateInfoLabels, 
  generateSpaceStationData, 
  generateSpaceProbeData,
} from './store/generators'
import { initializeActions } from './store/actions'
import type { ExplosionData } from './store/types'

const spline = new WiderGrannyKnot()
const track = new TubeGeometry(spline, 200, 0.15, 10, true)
const guid = 0

export const gameStore = reactive({
  spline,
  battleScore: 0,
  stardust: 0,
  health: 100,
  loopCount: 0,
  totalLoops: 7, // total game loops
  lasers: [] as number[],
  explosions: [] as ExplosionData[],
  initialRockCount: 100,
  initialEnemyCount: 10,
  rocks: randomData(100, track, 150, 8, () => 1 + Math.random() * 2.5, guid),
  enemies: randomData(10, track, 20, 15, 1, guid),
  rings: generateRings(40, track),
  chainweb3D: generateChainweb3D(30, track),
  PetersenGraphGroup: generatePetersenGraph(track),
  infoLabels: generateInfoLabels(track),
  spaceStation: generateSpaceStationData(track),
  spaceProbe: generateSpaceProbeData(track),
  camera: new PerspectiveCamera(),
  sound: false,
  showInfoText: true, // state to control text visibility
  gameMode: GameMode.Battle, // Default to Battle mode
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

    track: track as TubeGeometry,
    scale: 15,
    fov: 70,
    hits: 0,

    particles: randomData(500, track, 100, 1, () => 0.5 + Math.random() * 0.8, guid),
    looptime: 40 * 1000, // default to fast mode
    binormal: new Vector3(),
    normal: new Vector3(),
    clock: new Clock(false),
    mouse: new Vector2(-250, 50),

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
    playAudio: null as unknown as (audio: HTMLAudioElement, volume?: number, loop?: boolean) => void,
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
    restartGame: null as unknown as (switchMode: boolean) => void,
    showModal: null as unknown as (type: string) => void,
    hideModal: null as unknown as () => void,
    addStardust: null as unknown as () => void,
  },
})

// Initialize actions
initializeActions(gameStore, guid, track, audio)

// Initialize camera on mount
const camera = shallowRef(new PerspectiveCamera())
onMounted(() => {
  gameStore.actions.init(camera.value)
})

export type GameStore = typeof gameStore