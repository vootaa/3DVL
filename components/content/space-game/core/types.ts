
import { GameState } from './constants'
import { POINTS_OF_INTEREST } from '../store/constants'

export interface StateTransition {
  from: GameState
  to: GameState
  condition?: () => boolean
}

/**
 * Handler function type for state change events
 * Called when game state transitions to a new state
 */
export interface StateChangeHandler {
  (state: GameState): void
}

/**
 * Manages mouse events for different game states
 * Provides a unified interface for handling mouse interactions
 */
export interface MouseHandler {
  onMouseMove?: (event: MouseEvent) => void
  onMouseDown?: (event: MouseEvent) => void
  onMouseUp?: (event: MouseEvent) => void
  onWheel?: (event: WheelEvent) => void
}

// Game controller interface
export interface IGameController {
  getCurrentState(): GameState
  canShoot(): boolean
  canObserve(): boolean
  isLaunchMode(): boolean
  isBattleMode(): boolean
  isExploreMode(): boolean
  isObservationMode(): boolean
  startBattleMode(): Promise<boolean>
  startExploreMode(): Promise<boolean>
  enterObservation(pointOfInterestKey: keyof typeof POINTS_OF_INTEREST): boolean
  exitObservation(): boolean
  switchGameMode(): boolean
  cleanup(): void
}