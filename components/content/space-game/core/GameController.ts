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

    // Set gameStore in mouseEventManager
    mouseEventManager.setGameStore(this.gameStore)

    // Setup state change handlers
    this.setupStateChangeHandlers()
  }

  private setupStateChangeHandlers() {
    // Setup handlers for each state
    this.stateChangeUnsubscribers.push(
      gameStateManager.onStateChange(GameState.LAUNCH, () => {
        this.handleLaunchState()
      })
    )

    this.stateChangeUnsubscribers.push(
      gameStateManager.onStateChange(GameState.BATTLE, () => {
        this.handleBattleState()
      })
    )

    this.stateChangeUnsubscribers.push(
      gameStateManager.onStateChange(GameState.EXPLORE, () => {
        this.handleExploreState()
      })
    )

    this.stateChangeUnsubscribers.push(
      gameStateManager.onStateChange(GameState.OBSERVATION, () => {
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

  isInteractionBlocked(): boolean {
    return this.gameStore.modal.show
  }

  // State transition methods
  startBattleMode(): boolean {
    if (!gameStateManager.setState(GameState.BATTLE)) return false

    this.gameStore.actions.startGame(GameState.BATTLE)
    return true
  }

  startExploreMode(): boolean {
    if (!gameStateManager.setState(GameState.EXPLORE)) return false

    this.gameStore.actions.startGame(GameState.EXPLORE)
    return true
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
    const currentState = gameStateManager.getCurrentState()

    if (currentState === GameState.BATTLE) {
      return this.startExploreMode()
    } else if (currentState === GameState.EXPLORE) {
      return this.startBattleMode()
    }

    return false
  }

  // State handlers
  private handleLaunchState() {
    console.log('Initializing game in Launch mode')
    // Initialize mouse manager but don't activate handlers
    mouseEventManager.initialize()
  }

  private handleBattleState() {
    console.log('Entering Battle Mode')

    // Start appropriate sounds
    if (this.gameStore.sound && this.gameStore.audioSystem) {
      this.gameStore.audioSystem.play('bg', true, 0.3)
      this.gameStore.audioSystem.play('engine', true, 0.7)
      this.gameStore.audioSystem.play('engine2', true, 0.5)
    }
  }

  private handleExploreState() {
    console.log('Entering Explore Mode')

    // Start appropriate sounds
    if (this.gameStore.sound && this.gameStore.audioSystem) {
      this.gameStore.audioSystem.play('bg', true, 0.3)
      this.gameStore.audioSystem.play('engine', true, 0.6)
      this.gameStore.audioSystem.play('engine2', true, 0.4)
    }
  }

  private handleObservationState() {
    console.log('Entering Observation Mode')

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