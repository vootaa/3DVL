import type { Euler, PerspectiveCamera, Vector3 } from 'three'
import type { timeManager } from './TimeManager'
import type { GameMode, ObservationMode, POINTS_OF_INTEREST, SpeedMode } from './constants'

export interface ExplosionData {
  time: number
  offset: Vector3
  color: string
  particles: Array<{
    position: Vector3
    dPos: Vector3
  }>
  [key: string]: any
}

export interface GameStore {
  spline: any
  battleScore: number
  stardust: number
  health: number
  loopCount: number
  totalLoops: number
  lasers: number[]
  explosions: ExplosionData[]
  initialRockCount: number
  initialEnemyCount: number
  rocks: any[]
  enemies: any[]
  rings: any[]
  chainweb3D: any[]
  PetersenGraphGroup: any[]
  infoLabels: any[]
  spaceStation: any
  spaceProbe: any
  camera: PerspectiveCamera
  sound: boolean
  showInfoText: boolean
  gameMode: GameMode
  speedMode: SpeedMode
  modal: {
    show: boolean
    type: string
  }
  timeManager: typeof timeManager
  observationMode: ObservationMode
  currentPointOfInterest: keyof typeof POINTS_OF_INTEREST | null
  observedPoints: string[]
  orbitAngle: number
  orbitHeight: number
  comboSystem: {
    count: number
    lastHitTime: number
    timeWindow: number
    active: boolean
    resetTimer: ReturnType<typeof setTimeout>
  }
  scoreNotifications: Array<{
    id: number
    text: string
    points: number
    isBonus?: boolean
    timestamp: number
  }>
  mutation: {
    t: number
    lastT: number
    position: Vector3
    startTime: number
    observationStartTime: number
    track: any
    scale: number
    fov: number
    hits: number
    particles: any[]
    looptime: number
    binormal: Vector3
    normal: Vector3
    clock: any
    mouse: any
    dummy: any
    ray: any
    box: any
    cancelExplosionTO: any
    cancelLaserTO: any
    orbitCenter: Vector3
    orbitTarget: Vector3
    orbitDistance: number
    orbitSpeed: number
    previousPosition: Vector3
    previousTime: number
    pausedTime: number
    isPaused: boolean
  }
  actions: {
    playAudio: (audio: HTMLAudioElement, volume?: number, loop?: boolean) => void
    toggleSound: (sound?: boolean) => void
    toggleInfoText: (show?: boolean) => void
    shoot: () => void
    test: (data: {
      size: number
      offset: Vector3
      scale: number
      hit: any
      distance: number
    }) => boolean
    updateMouse: (mouse: { clientX: number; clientY: number }) => void
    init: (camera: PerspectiveCamera) => void
    update: () => void
    switchGameMode: () => void
    switchSpeedMode: () => void
    toggleObservationMode: (pointOfInterestKey: keyof typeof POINTS_OF_INTEREST | null) => void
    updateOrbitPosition: (horizontalAngle: number, verticalAngle: number) => void
    resumeJourney: () => void
    registerHit: (count: number, type: 'rock' | 'enemy') => void
    addScoreNotification: (text: string, points: number, isBonus: boolean) => void
    restartGame: (switchMode: boolean) => void
    showModal: (type: string) => void
    hideModal: () => void
    addStardust: () => void
  }
}

export interface ObjectData {
  guid: number
  scale: number
  size: number
  offset: Vector3
  pos: Vector3
  speed: number
  radius: number
  t: number
  hit: Vector3
  distance: number
  rotation: Euler
}