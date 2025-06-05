import type { Euler, PerspectiveCamera, Vector3 } from 'three'
import type { GameState } from '../core/constants'
import type { ModalType, POINTS_OF_INTEREST } from './constants'

// Core game data interfaces
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

// Score notification interface
export interface ScoreNotification {
  id: number
  text: string
  points: number
  isBonus?: boolean
  timestamp?: number
}

// Combat system interface
export interface ComboSystem {
  count: number
  lastHitTime: number
  timeWindow: number
  active: boolean
  resetTimer: ReturnType<typeof setTimeout>
}

// Modal state interface
export interface ModalState {
  show: boolean
  type: ModalType
}

// Action interfaces - updated to match new architecture
export interface GameActions {
  // Core game actions
  init(camera: PerspectiveCamera): void
  update(): void
  startGame(mode: GameState): void
  
  // Audio control
  toggleSound(sound?: boolean): void
  
  // UI control
  toggleInfoText(show?: boolean): void
  showModal(type: string): void
  hideModal(): void
  
  // Combat system
  shoot(): void
  test(data: {
    size: number
    offset: Vector3
    scale: number
    hit: any
    distance: number
  }): boolean
  registerHit(count: number, type: 'rock' | 'enemy'): void
  
  // Scoring system
  addScoreNotification(text: string, points: number, isBonus?: boolean): void
  addStardust(): void
  
  // Mode switching
  switchGameMode(): void
  switchSpeedMode(): void

  setGameController: (controller: any) => void
}

// Point of Interest interface
export interface PointOfInterest {
  name: string
  trackPosition: number | number[]
  orbitDistance: number
  orbitSpeed: number
}

// Time manager interface
export interface TimeManager {
  actions: {
    reset(resetTotal?: boolean): void
    pause(): void
    resume(): void
  }
  totalTime: number
  gameTime: number
  isPaused: boolean
}

// Utility types
export type HitType = 'rock' | 'enemy'
export type NotificationId = number