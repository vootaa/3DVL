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
  private isActive = false
  private lastMouseX = 0
  private lastMouseY = 0
  private pointerCapture = false
  private currentPointerId = -1
  private gameStore: GameStore | null = null
  private canvasElement: HTMLElement | null = null
  
  // Store bound event handlers for easier cleanup
  private boundHandlers = {
    pointermove: (e: Event) => this.handleMouseMove(e as PointerEvent),
    pointerdown: (e: Event) => this.handleMouseDown(e as PointerEvent),
    pointerup: (e: Event) => this.handleMouseUp(e as PointerEvent),
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

  setActiveState(active: boolean) {
    this.isActive = active

    if (!active) {
      this.isDragging = false
    }

    console.log(`Mouse event manager active state: ${active}`)
    return this // Support chain calls
  }

  setCanvasElement(element: HTMLElement) {
    if (element !== this.canvasElement) {
      if (this.isInitialized) {
        this.cleanup()
      }

      this.canvasElement = element
      console.log('Canvas element set:', element)

      if (this.isActive) {
        this.initialize()
      }
    }
    return this // Support chain calls
  }

  private initializeHandlers() {
    if (!this.gameStore) return

    // Define state handlers
    this.handlers.clear()

    this.handlers.set(GameState.LAUNCH, {})
    
    // Battle mode
    this.handlers.set(GameState.BATTLE, {
      onMouseMove: (event: PointerEvent) => {
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
      onMouseMove: (event: PointerEvent) => {
        if (!this.gameStore) return
        this.updateShipPosition(event)
      }
    })
    
    // Observation mode
    this.handlers.set(GameState.OBSERVATION, {
      onMouseMove: (event: PointerEvent) => {
        console.log('Observation mode dragging active')
        if (this.isDragging) {
          this.handleOrbitDrag(event)
        }
      },
      onMouseDown: (event: PointerEvent) => {
        console.log('Observation mode mousedown')
        this.startOrbitDrag(event)
      },
      onMouseUp: () => {
        console.log('Observation mode mouseup')
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
    if (this.isInitialized) {
      this.cleanup()
    }
    // Reset dragging state when re-initializing
    this.isDragging = false

    if (!this.gameStore) {
      console.error('Cannot initialize MouseEventManager - gameStore is null')
      return this
    }

    // Use more explicit event listening options
    const eventOptions = {
      passive: false,
      capture: true  // Add capture phase handling to ensure events are captured
    }

    const target = this.canvasElement || window

    target.addEventListener('pointermove', this.boundHandlers.pointermove, eventOptions)
    target.addEventListener('pointerdown', this.boundHandlers.pointerdown, eventOptions)
    target.addEventListener('pointerup', this.boundHandlers.pointerup, eventOptions)
    target.addEventListener('wheel', this.boundHandlers.wheel, eventOptions)
    target.addEventListener('pointerleave', this.boundHandlers.pointerup, eventOptions)

    this.isInitialized = true
    console.log('Mouse event manager initialized on', this.canvasElement ? 'canvas element' : 'window')
    return this // Support chain calls
  }

  cleanup() {
    if (!this.isInitialized) return

    const target = this.canvasElement || window

    target.removeEventListener('pointermove', this.boundHandlers.pointermove)
    target.removeEventListener('pointerdown', this.boundHandlers.pointerdown)
    target.removeEventListener('pointerup', this.boundHandlers.pointerup)
    target.removeEventListener('wheel', this.boundHandlers.wheel)
    target.removeEventListener('pointerleave', this.boundHandlers.pointerup)

    this.isInitialized = false
    console.log('Mouse event manager cleaned up')
  }

  private handleMouseMove(event: PointerEvent) {
    if (!this.isActive) {
      return
    }

    const currentState = gameStateManager.getCurrentState()

    if (Math.random() < 0.05) {
      console.log(`Pointer move in state: ${currentState}, isDragging: ${this.isDragging}`)
    }

    // Specifically handle dragging in observation mode
    if (this.isDragging && gameStateManager.isObservationMode()) {
      console.log('Handling orbit drag movement')
      this.handleOrbitDrag(event)
      return  // Return after direct handling, skip regular process
    }

    // Handle regular mouse position updates
    if (gameStateManager.canFlightMode()) {
      console.log('Updating ship position in flight mode')
      this.updateShipPosition(event)
      return
    }

    // Regular handling process
    const handler = this.handlers.get(currentState)
    if (handler?.onMouseMove) {
      handler.onMouseMove(event)
    }
  }

  private handleMouseDown(event: PointerEvent) {
    if (!this.isActive) {
      console.log('Mouse down ignored - manager not active')
      return
    }

    const currentState = gameStateManager.getCurrentState()
    console.log(`Mouse down in state: ${currentState}`)

    const handler = this.handlers.get(currentState)

    if (handler?.onMouseDown) {
      handler.onMouseDown(event)
    } else if (gameStateManager.isObservationMode()) {
      console.log('Fallback orbit drag start')
      this.startOrbitDrag(event)
    }
  }

  private handleMouseUp(event: PointerEvent) {
    if (!this.isActive) return

    const currentState = gameStateManager.getCurrentState()
    console.log(`Pointer up in state: ${currentState}`)

    if (this.pointerCapture && this.canvasElement && this.currentPointerId === event.pointerId) {
      try {
        this.canvasElement.releasePointerCapture(event.pointerId)
        console.log('Pointer capture released for ID:', event.pointerId)
        this.pointerCapture = false
      } catch (e) {
        console.error('Failed to release pointer capture:', e)
      }
    }

    const handler = this.handlers.get(currentState)
    if (handler?.onMouseUp) {
      handler.onMouseUp(event)
    }

    if (this.isDragging && gameStateManager.isObservationMode()) {
      this.isDragging = false
      console.log('Drag state reset on pointer up')
    }
  }

  private handleWheel(event: WheelEvent) {
    if (!this.isActive) return

    const currentState = gameStateManager.getCurrentState()
    const handler = this.handlers.get(currentState)
    if (handler?.onWheel) {
      event.preventDefault()
      handler.onWheel(event)
    }
  }

  private updateShipPosition(event: PointerEvent) {
    if (!this.gameStore || !this.isActive) {
      return
    }

    // Calculate coordinates relative to window center
    const x = event.clientX - window.innerWidth / 2
    const y = event.clientY - window.innerHeight / 2

    console.log('Ship position update:', { x, y, clientX: event.clientX, clientY: event.clientY })

    // Ensure direct modification of mutation object properties
    this.gameStore.mutation.mouse.x = x
    this.gameStore.mutation.mouse.y = y

    console.log('Updated mouse position:', this.gameStore.mutation.mouse)
  }

  private startOrbitDrag(event: PointerEvent) {
    if (!gameStateManager.isObservationMode()) {
      console.log('Not starting orbit drag - not in observation mode')
      return
    }

    console.log('Start orbit drag', { x: event.clientX, y: event.clientY })

    this.isDragging = true
    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY

    if (this.canvasElement) {
      try {
        this.canvasElement.setPointerCapture(event.pointerId)
        console.log('Pointer capture set for ID:', event.pointerId)
        this.pointerCapture = true
        this.currentPointerId = event.pointerId
      } catch (e) {
        console.error('Failed to set pointer capture:', e)
      }
    }

    event.preventDefault()
    event.stopPropagation()
  }

  private handleOrbitDrag(event: PointerEvent) {
    if (!this.isDragging || !this.gameStore) {
      return
    }

    const deltaX = event.clientX - this.lastMouseX
    const deltaY = event.clientY - this.lastMouseY

    if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
      console.log('Orbit drag delta', { deltaX, deltaY })
    }

    const prevAngle = this.gameStore.orbitAngle
    const prevHeight = this.gameStore.orbitHeight

    this.gameStore.orbitAngle += deltaX * 0.01

    this.gameStore.orbitHeight = Math.max(
      -Math.PI / 3,
      Math.min(Math.PI / 3, this.gameStore.orbitHeight + deltaY * 0.01)
    )

    if (Math.abs(this.gameStore.orbitAngle - prevAngle) > 0.001 ||
      Math.abs(this.gameStore.orbitHeight - prevHeight) > 0.001) {
      console.log('Updated orbit angles:', {
        orbitAngle: this.gameStore.orbitAngle.toFixed(3),
        orbitHeight: this.gameStore.orbitHeight.toFixed(3)
      })
    }

    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY

    event.preventDefault()
    event.stopPropagation()
  }

  private handleOrbitZoom(event: WheelEvent) {
    if (!this.gameStore) return
    
    const delta = event.deltaY > 0 ? 5 : -5
    this.gameStore.mutation.orbitDistance = Math.max(30, Math.min(200, this.gameStore.mutation.orbitDistance + delta))
  }
}

export const mouseEventManager = new MouseEventManager()