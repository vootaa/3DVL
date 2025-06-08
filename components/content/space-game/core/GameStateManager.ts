/**
 * Game State Manager
 * Manages the 4 core states of the game and their transitions
 */
import { ref, type Ref } from 'vue'
import { GameState } from './constants'
import { Logger } from './logger'

import type { StateTransition, StateChangeHandler } from './types'

export class GameStateManager {
  private _currentState: Ref<GameState> = ref(GameState.LAUNCH)
  private _previousState: Ref<GameState | null> = ref(null)

  private stateChangeCallbacks: Map<GameState, StateChangeHandler[]> = new Map()
  private globalStateChangeCallbacks: StateChangeHandler[] = []

  public readonly state = ref<GameState>(GameState.LAUNCH)

  get currentState(): GameState {
    return this._currentState.value
  }

  set currentState(newState: GameState) {
    this._previousState.value = this._currentState.value
    this._currentState.value = newState

    // Synchronize the external reactive state
    this.state.value = newState

    this.onStateChange(newState)
  }

  get previousState(): GameState | null {
    return this._previousState.value
  }

  set previousState(value: GameState | null) {
    this._previousState.value = value
  }
  
  // Define valid state transitions
  private validTransitions: StateTransition[] = [
    { from: GameState.LAUNCH, to: GameState.BATTLE },
    { from: GameState.LAUNCH, to: GameState.EXPLORE },
    { from: GameState.BATTLE, to: GameState.EXPLORE },
    { from: GameState.EXPLORE, to: GameState.BATTLE },
    { from: GameState.EXPLORE, to: GameState.OBSERVATION },
    { from: GameState.OBSERVATION, to: GameState.EXPLORE }
  ]

  constructor() {
    this.initializeStateCallbacks()
    Logger.log('STATE_MANAGER', 'GameStateManager initialized', { initialState: GameState.LAUNCH })
  }

  private initializeStateCallbacks() {
    Object.values(GameState).forEach(state => {
      this.stateChangeCallbacks.set(state, [])
    })
  }

  getCurrentState(): GameState {
    return this.currentState
  }

  getPreviousState(): GameState | null {
    return this.previousState
  }

  canTransition(to: GameState): boolean {
    return this.validTransitions.some(
      transition => transition.from === this.currentState &&
        transition.to === to &&
        (!transition.condition || transition.condition())
    )
  }

  setState(newState: GameState, force: boolean = false): boolean {
    if (!force && !this.canTransition(newState)) {
      Logger.error('STATE_MANAGER', 'Invalid state transition attempted', {
        from: this.currentState,
        to: newState,
        force: force
      })
      return false
    }

    const oldState = this.currentState
    this.previousState = oldState
    this.currentState = newState

    // Trigger state change callbacks
    this.executeStateCallbacks(newState)

    // Trigger global state change callbacks
    this.executeGlobalStateCallbacks(newState)

    Logger.log('STATE_MANAGER', 'State transition completed', {
      from: oldState,
      to: newState,
      force: force
    })
    return true
  }

  registerStateChangeCallback(state: GameState, callback: StateChangeHandler) {
    const callbacks = this.stateChangeCallbacks.get(state)
    if (callbacks) {
      callbacks.push(callback)
      Logger.log('STATE_MANAGER', 'State change callback registered', {
        state: state,
        callbackCount: callbacks.length
      })
    }
    return () => this.removeStateChangeCallback(state, callback)
  }

  registerGlobalStateChangeCallback(callback: StateChangeHandler) {
    this.globalStateChangeCallbacks.push(callback)
    Logger.log('STATE_MANAGER', 'Global state change callback registered', {
      globalCallbackCount: this.globalStateChangeCallbacks.length
    })
    return () => this.removeGlobalStateChangeCallback(callback)
  }

  onStateChange(state: GameState, callback?: StateChangeHandler) {
    if (callback) {
      return this.registerStateChangeCallback(state, callback)
    } else {
      this.executeStateCallbacks(state);
      this.executeGlobalStateCallbacks(state);
    }
  }

  onAnyStateChange(callback: StateChangeHandler) {
    return this.registerGlobalStateChangeCallback(callback)
  }

  private removeStateChangeCallback(state: GameState, callback: StateChangeHandler) {
    const callbacks = this.stateChangeCallbacks.get(state)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
        Logger.log('STATE_MANAGER', 'State change callback removed', {
          state: state,
          remainingCallbacks: callbacks.length
        })
      }
    }
  }

  private removeGlobalStateChangeCallback(callback: StateChangeHandler) {
    const index = this.globalStateChangeCallbacks.indexOf(callback)
    if (index !== -1) {
      this.globalStateChangeCallbacks.splice(index, 1)
      Logger.log('STATE_MANAGER', 'Global state change callback removed', {
        remainingGlobalCallbacks: this.globalStateChangeCallbacks.length
      })
    }
  }

  private executeStateCallbacks(state: GameState) {
    const callbacks = this.stateChangeCallbacks.get(state)
    if (callbacks && callbacks.length > 0) {
      Logger.throttle('STATE_MANAGER', 'Executing state callbacks', {
        state: state,
        callbackCount: callbacks.length
      })
      callbacks.forEach(callback => callback(state))
    }
  }

  private executeGlobalStateCallbacks(state: GameState) {
    if (this.globalStateChangeCallbacks.length > 0) {
      Logger.throttle('STATE_MANAGER', 'Executing global state callbacks', {
        state: state,
        globalCallbackCount: this.globalStateChangeCallbacks.length
      })
      this.globalStateChangeCallbacks.forEach(callback => callback(state))
    }
  }

  // Helper methods for common state checks
  isLaunchMode(): boolean {
    return this.currentState === GameState.LAUNCH
  }

  isBattleMode(): boolean {
    return this.currentState === GameState.BATTLE
  }

  isExploreMode(): boolean {
    return this.currentState === GameState.EXPLORE
  }

  isObservationMode(): boolean {
    return this.currentState === GameState.OBSERVATION
  }

  canShoot(): boolean {
    return this.isBattleMode()
  }

  canObserve(): boolean {
    return this.isExploreMode()
  }

  canFlightMode(): boolean {
    return this.isBattleMode() || this.isExploreMode()
  }

  isExploreOrObservationMode(): boolean {
    return this.isExploreMode() || this.isObservationMode()
  }

  isBattleOrExploreMode(): boolean {
    return this.isBattleMode() || this.isExploreMode()
  }

  reset() {
    this.setState(GameState.LAUNCH, true)
    this.previousState = null
    Logger.log('STATE_MANAGER', 'GameStateManager reset to initial state')
  }
}

export const gameStateManager = new GameStateManager()