/**
 * Game Controller
 * Coordinates interactions between the state manager and other systems
 */

import { GameState } from './constants'
import { gameStateManager } from './GameStateManager'
import { mouseEventManager } from './MouseEventManager'
import { POINTS_OF_INTEREST } from '../store/constants'
import { initializeActions } from '../store/actions'

import type { IGameController } from './types'
import type { GameStore } from '../GameStore'

export class GameController implements IGameController {
  private gameStore: GameStore
  private stateChangeUnsubscribers: Array<() => void> = []

  constructor(gameStore: GameStore) {
    this.gameStore = gameStore

    // Initialize actions
    initializeActions(this.gameStore)

   if (typeof this.gameStore.actions.setGameController === 'function') {
      this.gameStore.actions.setGameController(this)
    } else {
      console.error("setGameController is not a function in gameStore.actions", this.gameStore.actions)
    }

    // Set gameStore in mouseEventManager
    mouseEventManager.setGameStore(this.gameStore)

    // Setup state change handlers
    this.setupStateChangeHandlers()
  }

  private setupStateChangeHandlers() {
    // Setup handlers for each state
    this.stateChangeUnsubscribers.push(
      gameStateManager.registerStateChangeCallback(GameState.LAUNCH, () => {
        this.handleLaunchState()
      })
    )

    this.stateChangeUnsubscribers.push(
      gameStateManager.registerStateChangeCallback(GameState.BATTLE, () => {
        this.handleBattleState()
      })
    )

    this.stateChangeUnsubscribers.push(
      gameStateManager.registerStateChangeCallback(GameState.EXPLORE, () => {
        this.handleExploreState()
      })
    )

    this.stateChangeUnsubscribers.push(
      gameStateManager.registerStateChangeCallback(GameState.OBSERVATION, () => {
        this.handleObservationState()
      })
    )
  }

  // Required interface methods
  getCurrentState(): GameState {
    return gameStateManager.getCurrentState()
  }

  canShoot(): boolean {
    return gameStateManager.canShoot()
  }

  canObserve(): boolean {
    return gameStateManager.canObserve()
  }

  isLaunchMode(): boolean {
    return gameStateManager.isLaunchMode()
  }

  isBattleMode(): boolean {
    return gameStateManager.isBattleMode()
  }

  isExploreMode(): boolean {
    return gameStateManager.isExploreMode()
  }

  isObservationMode(): boolean {
    return gameStateManager.isObservationMode()
  }

  // State transition methods
  async startBattleMode(): Promise<boolean> {
    try {
      if (!this.gameStore || !this.gameStore.camera) {
        console.error("Game store or camera not initialized")
        return false
      }

      gameStateManager.setState(GameState.BATTLE)
      this.gameStore.actions.startGame(GameState.BATTLE)
      return true
    } catch (error) {
      console.error('Failed to start battle mode:', error)
      return false
    }
  }

  async startExploreMode(): Promise<boolean> {
    try {
      if (!this.gameStore || !this.gameStore.camera) {
        console.error("Game store or camera not initialized")
        return false
      }

      gameStateManager.setState(GameState.EXPLORE)
      this.gameStore.actions.startGame(GameState.EXPLORE)
      return true
    } catch (error) {
      console.error('Failed to start explore mode:', error)
      return false
    }
  }

  enterObservation(pointOfInterestKey: keyof typeof POINTS_OF_INTEREST): boolean {
    if (!gameStateManager.canObserve()) return false
    if (!gameStateManager.setState(GameState.OBSERVATION)) return false

    this.setupObservationMode(pointOfInterestKey)
    return true
  }

  exitObservation(): boolean {
    if (!gameStateManager.setState(GameState.EXPLORE)) return false

    this.resumeExploration()
    return true
  }

  switchGameMode(): boolean {
    try {
      if (gameStateManager.isBattleMode()) {
        return this.startExploreMode() as unknown as boolean
      } else if (gameStateManager.isExploreMode()) {
        return this.startBattleMode() as unknown as boolean
      }
      return false
    } catch (error) {
      console.error('Failed to switch game mode:', error)
      return false
    }
  }

  // State handlers
  private handleLaunchState() {
    console.log('Initializing game in Launch mode')

    mouseEventManager.setGameStore(this.gameStore).setActiveState(false)
  }

  private handleBattleState() {
    mouseEventManager.setGameStore(this.gameStore).setActiveState(true)

    // Start appropriate sounds
    if (this.gameStore.sound && this.gameStore.audioSystem) {
      this.gameStore.audioSystem.play('bg', true, 0.3)
      this.gameStore.audioSystem.play('engine', true, 0.7)
      this.gameStore.audioSystem.play('engine2', true, 0.5)
    }
  }

  private handleExploreState() {
    mouseEventManager.setGameStore(this.gameStore).setActiveState(true)

    // Start appropriate sounds
    if (this.gameStore.sound && this.gameStore.audioSystem) {
      this.gameStore.audioSystem.play('bg', true, 0.3)
      this.gameStore.audioSystem.play('engine', true, 0.6)
      this.gameStore.audioSystem.play('engine2', true, 0.4)
    }
  }

  private handleObservationState() {
    mouseEventManager.setGameStore(this.gameStore).setActiveState(true)

    // Adjust sounds for observation mode
    if (this.gameStore.sound && this.gameStore.audioSystem) {
      this.gameStore.audioSystem.stop('bg')
      this.gameStore.audioSystem.stop('engine')
      this.gameStore.audioSystem.stop('engine2')
    }
  }

  private setupObservationMode(pointOfInterestKey: keyof typeof POINTS_OF_INTEREST) {
    const poi = POINTS_OF_INTEREST[pointOfInterestKey]
    const track = this.gameStore.mutation.track
    const mutation = this.gameStore.mutation

    // Set current point of interest
    this.gameStore.currentPointOfInterest = pointOfInterestKey

    // Track observation start time
    mutation.observationStartTime = Date.now()

    // Pause ship movement
    mutation.previousPosition.copy(mutation.position)
    mutation.previousTime = Date.now()
    mutation.isPaused = true

    // Setup orbit parameters
    const poiPosition = Array.isArray(poi.trackPosition)
      ? poi.trackPosition[0]
      : poi.trackPosition

    mutation.orbitCenter.copy(track.parameters.path.getPointAt(poiPosition).multiplyScalar(mutation.scale))
    mutation.orbitDistance = poi.orbitDistance
    mutation.orbitSpeed = poi.orbitSpeed

    // Initialize orbit angles
    this.gameStore.orbitAngle = 0
    this.gameStore.orbitHeight = 0
  }

  private resumeExploration() {
    const mutation = this.gameStore.mutation

    // Resume ship movement
    if (mutation.isPaused) {
      mutation.startTime += (Date.now() - mutation.previousTime)
      mutation.isPaused = false
    }

    this.gameStore.currentPointOfInterest = null

    // Resume engine sounds
    if (this.gameStore.sound && this.gameStore.audioSystem) {
      this.gameStore.audioSystem.play('engine', true, 0.6)
    }
  }

  cleanup() {
    // Clean up event handlers
    this.stateChangeUnsubscribers.forEach(unsubscribe => unsubscribe())
    this.stateChangeUnsubscribers = []

    // Clean up mouse event handler
    mouseEventManager.cleanup()

    // Clear any active timeouts
    clearTimeout(this.gameStore.mutation.cancelExplosionTO)
    clearTimeout(this.gameStore.mutation.cancelLaserTO)
    clearTimeout(this.gameStore.comboSystem.resetTimer)

    // Stop all audio
    if (this.gameStore.audioSystem) {
      this.gameStore.audioSystem.stopAll()
    }
  }
}