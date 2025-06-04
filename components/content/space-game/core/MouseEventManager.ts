/**
 * Mouse Event Manager
 * Unified management of mouse behaviors in different states
 */

import { GameState } from './constants'
import { gameStateManager } from './GameStateManager'

import type { MouseHandler } from './types'
import type { GameStore } from '../GameStore'

export class MouseEventManager {
  private handlers: Map<GameState, MouseHandler> = new Map()
  private isInitialized = false
  private isDragging = false
  private lastMouseX = 0
  private lastMouseY = 0
  private gameStore: GameStore | null = null

  private boundHandlers = {
    mousemove: this.handleMouseMove.bind(this),
    mousedown: this.handleMouseDown.bind(this),
    mouseup: this.handleMouseUp.bind(this),
    wheel: this.handleWheel.bind(this)
  }

  constructor() {
    // Handlers will be initialized when gameStore is set
  }

  setGameStore(gameStore: GameStore) {
    this.gameStore = gameStore
    this.initializeHandlers()
  }

  private initializeHandlers() {
    if (!this.gameStore) return

    // Battle mode handlers
    this.handlers.set(GameState.BATTLE, {
      onMouseMove: (event: MouseEvent) => {
        this.updateShipPosition(event)
      },
      onMouseDown: (event: MouseEvent) => {
        this.handleShoot()
      }
    })

    // Explore mode handlers  
    this.handlers.set(GameState.EXPLORE, {
      onMouseMove: (event: MouseEvent) => {
        this.updateShipPosition(event)
      }
    })

    // Observation mode handlers
    this.handlers.set(GameState.OBSERVATION, {
      onMouseMove: (event: MouseEvent) => {
        this.handleOrbitRotation(event)
      },
      onMouseDown: (event: MouseEvent) => {
        this.startOrbitDrag(event)
      },
      onMouseUp: (event: MouseEvent) => {
        this.endOrbitDrag()
      },
      onWheel: (event: WheelEvent) => {
        this.handleOrbitZoom(event)
      }
    })

    // Launch screen - no mouse handlers needed
    this.handlers.set(GameState.LAUNCH, {})
  }

  initialize() {
    if (this.isInitialized || !this.gameStore) return

    window.addEventListener('mousemove', this.boundHandlers.mousemove)
    window.addEventListener('mousedown', this.boundHandlers.mousedown)
    window.addEventListener('mouseup', this.boundHandlers.mouseup)
    window.addEventListener('wheel', this.boundHandlers.wheel, { passive: false })

    this.isInitialized = true
  }

  cleanup() {
    if (!this.isInitialized) return

    window.removeEventListener('mousemove', this.boundHandlers.mousemove)
    window.removeEventListener('mousedown', this.boundHandlers.mousedown)
    window.removeEventListener('mouseup', this.boundHandlers.mouseup)
    window.removeEventListener('wheel', this.boundHandlers.wheel)

    this.isInitialized = false
  }

  private handleMouseMove(event: MouseEvent) {
    const currentState = gameStateManager.getCurrentState()
    const handler = this.handlers.get(currentState)

    if (handler?.onMouseMove) {
      handler.onMouseMove(event)
    }
  }

  private handleMouseDown(event: MouseEvent) {
    const currentState = gameStateManager.getCurrentState()
    const handler = this.handlers.get(currentState)

    if (handler?.onMouseDown) {
      handler.onMouseDown(event)
    }
  }

  private handleMouseUp(event: MouseEvent) {
    const currentState = gameStateManager.getCurrentState()
    const handler = this.handlers.get(currentState)

    if (handler?.onMouseUp) {
      handler.onMouseUp(event)
    }
  }

  private handleWheel(event: WheelEvent) {
    const currentState = gameStateManager.getCurrentState()
    const handler = this.handlers.get(currentState)

    if (handler?.onWheel) {
      event.preventDefault()
      handler.onWheel(event)
    }
  }

  // Specific mouse behavior implementations
  private updateShipPosition(event: MouseEvent) {
    if (!this.gameStore) return

    this.gameStore.mutation.mouse.x = event.clientX - window.innerWidth / 2
    this.gameStore.mutation.mouse.y = event.clientY - window.innerHeight / 2
  }

  private handleShoot() {
    if (!this.gameStore) return

    if (gameStateManager.canShoot()) {
      this.gameStore.actions.shoot()
    }
  }

  private startOrbitDrag(event: MouseEvent) {
    this.isDragging = true
    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY
  }

  private handleOrbitRotation(event: MouseEvent) {
    if (!this.gameStore || !this.isDragging) return

    const deltaX = event.clientX - this.lastMouseX
    const deltaY = event.clientY - this.lastMouseY

    this.gameStore.orbitAngle -= deltaX * 0.005
    this.gameStore.orbitHeight -= deltaY * 0.005

    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY
  }

  private endOrbitDrag() {
    this.isDragging = false
  }

  private handleOrbitZoom(event: WheelEvent) {
    if (!this.gameStore) return

    const delta = event.deltaY > 0 ? 5 : -5
    this.gameStore.mutation.orbitDistance = Math.max(30, Math.min(200, this.gameStore.mutation.orbitDistance + delta))
  }
}

export const mouseEventManager = new MouseEventManager()