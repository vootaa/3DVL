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
  
  // Store bound event handlers for easier cleanup
  private boundHandlers = {
    mousemove: (e: Event) => this.handleMouseMove(e as MouseEvent),
    mousedown: (e: Event) => this.handleMouseDown(e as MouseEvent),
    mouseup: (e: Event) => this.handleMouseUp(e as MouseEvent),
    wheel: (e: Event) => this.handleWheel(e as WheelEvent)
  }

  constructor() {
    // No additional binding needed, already done in boundHandlers definition
  }

  setGameStore(gameStore: GameStore) {
    this.gameStore = gameStore
    this.initializeHandlers()
    return this // Support chain calls
  }

  private initializeHandlers() {
    if (!this.gameStore) return

    // Define state handlers
    this.handlers.clear()
    
    // Battle mode
    this.handlers.set(GameState.BATTLE, {
      onMouseMove: (event: MouseEvent) => {
        if (!this.gameStore) return
        this.updateShipPosition(event)
      },
      onMouseDown: () => {
        if (!this.gameStore || !gameStateManager.canShoot()) return
        this.gameStore.actions.shoot()
      }
    })
    
    // Explore mode
    this.handlers.set(GameState.EXPLORE, {
      onMouseMove: (event: MouseEvent) => {
        if (!this.gameStore) return
        this.updateShipPosition(event)
      }
    })
    
    // Observation mode
    this.handlers.set(GameState.OBSERVATION, {
      onMouseMove: (event: MouseEvent) => {
        if (!this.gameStore || !this.isDragging) return
        this.handleOrbitRotation(event)
      },
      onMouseDown: (event: MouseEvent) => {
        this.startOrbitDrag(event)
      },
      onMouseUp: () => {
        this.isDragging = false
      },
      onWheel: (event: WheelEvent) => {
        if (!this.gameStore) return
        this.handleOrbitZoom(event)
      }
    })
    
    // Launch mode - no mouse handling
    this.handlers.set(GameState.LAUNCH, {})
  }

  initialize() {
    if (this.isInitialized || !this.gameStore) return this

    window.addEventListener('mousemove', this.boundHandlers.mousemove)
    window.addEventListener('mousedown', this.boundHandlers.mousedown)
    window.addEventListener('mouseup', this.boundHandlers.mouseup)
    window.addEventListener('wheel', this.boundHandlers.wheel, { passive: false })

    this.isInitialized = true
    return this // Support chain calls
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
    const handler = this.handlers.get(gameStateManager.getCurrentState())
    handler?.onMouseMove?.(event)
  }

  private handleMouseDown(event: MouseEvent) {
    const handler = this.handlers.get(gameStateManager.getCurrentState())
    handler?.onMouseDown?.(event)
  }

  private handleMouseUp(event: MouseEvent) {
    const handler = this.handlers.get(gameStateManager.getCurrentState())
    handler?.onMouseUp?.(event)
  }

  private handleWheel(event: WheelEvent) {
    const handler = this.handlers.get(gameStateManager.getCurrentState())
    if (handler?.onWheel) {
      event.preventDefault()
      handler.onWheel(event)
    }
  }

  private updateShipPosition(event: MouseEvent) {
    if (!this.gameStore) return
    this.gameStore.mutation.mouse.x = event.clientX - window.innerWidth / 2
    this.gameStore.mutation.mouse.y = event.clientY - window.innerHeight / 2
  }

  private startOrbitDrag(event: MouseEvent) {
    this.isDragging = true
    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY
  }

  private handleOrbitRotation(event: MouseEvent) {
    if (!this.gameStore) return
    
    const deltaX = event.clientX - this.lastMouseX
    const deltaY = event.clientY - this.lastMouseY

    this.gameStore.orbitAngle -= deltaX * 0.005
    this.gameStore.orbitHeight -= deltaY * 0.005

    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY
  }

  private handleOrbitZoom(event: WheelEvent) {
    if (!this.gameStore) return
    
    const delta = event.deltaY > 0 ? 5 : -5
    this.gameStore.mutation.orbitDistance = Math.max(30, Math.min(200, this.gameStore.mutation.orbitDistance + delta))
  }
}

export const mouseEventManager = new MouseEventManager()