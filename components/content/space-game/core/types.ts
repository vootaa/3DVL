
import { GameState } from './constants'

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