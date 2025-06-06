/**
 * Mouse Event Manager
 * Unified management of mouse behaviors in different states
 */

import { GameState, CAMERA_CONSTANTS } from './constants'
import { Logger } from './logger'
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

  // Orbit control smoothing
  private targetOrbitAngle = 0
  private targetOrbitHeight = 0
  private currentOrbitVelocityX = 0
  private currentOrbitVelocityY = 0
  private orbitDamping = CAMERA_CONSTANTS.ORBIT_CONTROL.DAMPING

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

    // Initialize orbit control targets with current values
    if (gameStore) {
      this.targetOrbitAngle = gameStore.orbitAngle || 0
      this.targetOrbitHeight = gameStore.orbitHeight || 0
    }

    this.initializeHandlers()
    return this // Support chain calls
  }

  setActiveState(active: boolean) {
    this.isActive = active

    if (!active) {
      this.isDragging = false
    }

    Logger.log('MouseManager', `Active state: ${active}`)
    return this // Support chain calls
  }

  setCanvasElement(element: HTMLElement) {
    if (element !== this.canvasElement) {
      if (this.isInitialized) {
        this.cleanup()
      }

      this.canvasElement = element
      Logger.log('MouseManager', 'Canvas element set', element)

      if (this.isActive) {
        this.initialize()
      }
    }
    return this // Support chain calls
  }

  // Call this method in animation loop to update orbit control smoothing
  updateOrbitControls() {
    if (!this.gameStore) return;

    // Calculate the difference between current and target angles
    const diffAngle = this.targetOrbitAngle - this.gameStore.orbitAngle;
    const diffHeight = this.targetOrbitHeight - this.gameStore.orbitHeight;

    // Apply damping for smooth motion
    this.currentOrbitVelocityX = this.currentOrbitVelocityX * this.orbitDamping + diffAngle * (1 - this.orbitDamping);
    this.currentOrbitVelocityY = this.currentOrbitVelocityY * this.orbitDamping + diffHeight * (1 - this.orbitDamping);

    // Only update if velocity is above threshold
    if (Math.abs(this.currentOrbitVelocityX) > CAMERA_CONSTANTS.ORBIT_CONTROL.MIN_VELOCITY) {
      this.gameStore.orbitAngle += this.currentOrbitVelocityX;
    }

    if (Math.abs(this.currentOrbitVelocityY) > CAMERA_CONSTANTS.ORBIT_CONTROL.MIN_VELOCITY) {
      this.gameStore.orbitHeight += this.currentOrbitVelocityY;
      // Ensure height stays within limits
      this.gameStore.orbitHeight = Math.max(
        CAMERA_CONSTANTS.MIN_ORBIT_HEIGHT,
        Math.min(CAMERA_CONSTANTS.MAX_ORBIT_HEIGHT, this.gameStore.orbitHeight)
      );
    }
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
        Logger.throttle('ObservationMode', 'Dragging active', null, 500)
        if (this.isDragging) {
          this.handleOrbitDrag(event)
        }
      },
      onMouseDown: (event: PointerEvent) => {
        Logger.log('ObservationMode', 'Mouse down')
        this.startOrbitDrag(event)
      },
      onMouseUp: () => {
        Logger.log('ObservationMode', 'Mouse up')
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
      Logger.error('MouseManager', 'Cannot initialize - gameStore is null')
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
    Logger.log('MouseManager', `Initialized on ${this.canvasElement ? 'canvas element' : 'window'}`)
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
    Logger.log('MouseManager', 'Cleaned up')
  }

  private handleMouseMove(event: PointerEvent) {
    if (!this.isActive) {
      return
    }

    const currentState = gameStateManager.getCurrentState()

    Logger.random('MouseMove', `State: ${currentState}, isDragging: ${this.isDragging}`)

    // Specifically handle dragging in observation mode
    if (this.isDragging && gameStateManager.isObservationMode()) {
      Logger.throttle('OrbitControl', 'Handling orbit drag movement', null, 200)
      this.handleOrbitDrag(event)
      return  // Return after direct handling, skip regular process
    }

    // Handle regular mouse position updates
    if (gameStateManager.canFlightMode()) {
      Logger.throttle('FlightMode', 'Updating ship position', null, 300)
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
      Logger.log('MouseManager', 'Mouse down ignored - manager not active')
      return
    }

    const currentState = gameStateManager.getCurrentState()
    Logger.log('MouseDown', `State: ${currentState}`)

    const handler = this.handlers.get(currentState)

    if (handler?.onMouseDown) {
      handler.onMouseDown(event)
    } else if (gameStateManager.isObservationMode()) {
      Logger.log('OrbitControl', 'Fallback orbit drag start')
      this.startOrbitDrag(event)
    }
  }

  private handleMouseUp(event: PointerEvent) {
    if (!this.isActive) return

    const currentState = gameStateManager.getCurrentState()
    Logger.log('MouseUp', `State: ${currentState}`)

    if (this.pointerCapture && this.canvasElement && this.currentPointerId === event.pointerId) {
      try {
        this.canvasElement.releasePointerCapture(event.pointerId)
        Logger.log('PointerCapture', `Released for ID: ${event.pointerId}`)
        this.pointerCapture = false
      } catch (e) {
        Logger.error('PointerCapture', 'Failed to release pointer capture', e)
      }
    }

    const handler = this.handlers.get(currentState)
    if (handler?.onMouseUp) {
      handler.onMouseUp(event)
    }

    if (this.isDragging && gameStateManager.isObservationMode()) {
      this.isDragging = false
      Logger.log('OrbitControl', 'Drag state reset on pointer up')
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

    Logger.throttle('ShipPosition', 'Update', { x, y, clientX: event.clientX, clientY: event.clientY }, 200)

    // Ensure direct modification of mutation object properties
    this.gameStore.mutation.mouse.x = x
    this.gameStore.mutation.mouse.y = y

    Logger.throttle('MousePosition', 'Updated', this.gameStore.mutation.mouse, 500)
  }

  private startOrbitDrag(event: PointerEvent) {
    if (!gameStateManager.isObservationMode()) {
      Logger.log('OrbitControl', 'Not starting orbit drag - not in observation mode')
      return
    }

    Logger.log('OrbitControl', 'Start drag', { x: event.clientX, y: event.clientY })

    this.isDragging = true
    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY

    // Sync target angles with current values at drag start
    if (this.gameStore) {
      this.targetOrbitAngle = this.gameStore.orbitAngle
      this.targetOrbitHeight = this.gameStore.orbitHeight
    }

    if (this.canvasElement) {
      try {
        this.canvasElement.setPointerCapture(event.pointerId)
        Logger.log('PointerCapture', `Set for ID: ${event.pointerId}`)
        this.pointerCapture = true
        this.currentPointerId = event.pointerId
      } catch (e) {
        Logger.error('PointerCapture', 'Failed to set pointer capture', e)
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

    Logger.throttle('OrbitDelta', '', { deltaX, deltaY }, 100)

    // Update target angles with reduced sensitivity
    this.targetOrbitAngle += deltaX * CAMERA_CONSTANTS.ORBIT_CONTROL.HORIZONTAL_SENSITIVITY
    this.targetOrbitHeight += deltaY * CAMERA_CONSTANTS.ORBIT_CONTROL.VERTICAL_SENSITIVITY

    // Constrain target height within limits
    this.targetOrbitHeight = Math.max(
      CAMERA_CONSTANTS.MIN_ORBIT_HEIGHT,
      Math.min(CAMERA_CONSTANTS.MAX_ORBIT_HEIGHT, this.targetOrbitHeight)
    )

    // Log changes when significant
    if (Math.abs(this.gameStore.orbitAngle - this.targetOrbitAngle) > 0.01 ||
      Math.abs(this.gameStore.orbitHeight - this.targetOrbitHeight) > 0.01) {
      Logger.throttle('OrbitTargets', 'Updated', {
        targetAngle: this.targetOrbitAngle.toFixed(3),
        targetHeight: this.targetOrbitHeight.toFixed(3),
        currentAngle: this.gameStore.orbitAngle.toFixed(3),
        currentHeight: this.gameStore.orbitHeight.toFixed(3)
      }, 200)
    }

    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY

    event.preventDefault()
    event.stopPropagation()
  }

  private handleOrbitZoom(event: WheelEvent) {
    if (!this.gameStore) return

    // Smoother zooming with smaller delta
    const delta = event.deltaY > 0 ? CAMERA_CONSTANTS.ORBIT_CONTROL.ZOOM_SPEED : -CAMERA_CONSTANTS.ORBIT_CONTROL.ZOOM_SPEED;

    const newDistance = Math.max(
      CAMERA_CONSTANTS.MIN_ORBIT_DISTANCE,
      Math.min(
        CAMERA_CONSTANTS.MAX_ORBIT_DISTANCE,
        this.gameStore.mutation.orbitDistance + delta
      )
    )

    // Apply zoom with some damping
    this.gameStore.mutation.orbitDistance = this.gameStore.mutation.orbitDistance * CAMERA_CONSTANTS.ORBIT_CONTROL.ZOOM_DAMPING +
      newDistance * (1 - CAMERA_CONSTANTS.ORBIT_CONTROL.ZOOM_DAMPING)

    Logger.throttle('OrbitZoom', 'Changed', { distance: this.gameStore.mutation.orbitDistance }, 200)

    event.preventDefault();
    event.stopPropagation();
  }
}

export const mouseEventManager = new MouseEventManager()