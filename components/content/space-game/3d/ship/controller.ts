import type { ComputedRef } from 'vue'
import { Logger } from '../../core/logger'
import { ShipPhysics } from './physics'
import { SHIP_CONTROLS } from './constants'

import type { ShipRefs, ShipControlState } from './types'
import type { GameStore } from '../../GameStore'

export class ShipController {
  private refs: ShipRefs
  private gameStore: GameStore
  private mouseX: ComputedRef<number>
  private mouseY: ComputedRef<number>
  private physics: ShipPhysics
  
  constructor(
    refs: ShipRefs, 
    gameStore: GameStore, 
    mouseX: ComputedRef<number>, 
    mouseY: ComputedRef<number>
  ) {
    this.refs = refs
    this.gameStore = gameStore
    this.mouseX = mouseX
    this.mouseY = mouseY
    this.physics = new ShipPhysics(refs)

    Logger.log('SHIP_CONTROLLER', 'Ship controller initialized')
  }
  
  // Get physics state
  getPhysicsState(): ShipControlState {
    return this.physics.getState()
  }
  
  // Handle float effect
  handleFloatEffect(time: number): void {
    this.refs.main.value.position.z = Math.sin(time * SHIP_CONTROLS.FLOAT_EFFECT.FREQUENCY) * 
                                      Math.PI * SHIP_CONTROLS.FLOAT_EFFECT.AMPLITUDE
  }
  
  // Handle observation mode
  handleObservationMode(time: number): void {
    const { main } = this.refs
    const resetRate = SHIP_CONTROLS.OBSERVATION.RESET_RATE
    
    // Slowly reset rotation
    main.value.rotation.z -= main.value.rotation.z * resetRate
    main.value.rotation.x -= main.value.rotation.x * resetRate
    main.value.rotation.y -= main.value.rotation.y * resetRate
    
    // Slowly reset position
    main.value.position.x -= main.value.position.x * resetRate
    main.value.position.y += (25 - main.value.position.y) * resetRate
    
    // Hover effect
    const period = SHIP_CONTROLS.OBSERVATION.HOVER_PERIOD
    const amplitude = SHIP_CONTROLS.OBSERVATION.HOVER_AMPLITUDE
    main.value.position.x += Math.sin(time / period) * amplitude
    main.value.position.y += Math.cos(time / period * 1.3) * amplitude
    
    // Reset inertia
    this.physics.resetForces()

    Logger.throttle('SHIP_CONTROLLER', 'Observation mode update', {
      position: { x: main.value.position.x, y: main.value.position.y },
      rotation: { x: main.value.rotation.x, y: main.value.rotation.y, z: main.value.rotation.z }
    })
  }
  
  // Handle flight mode
  handleFlightMode(): void {
    const mx = this.mouseX.value
    const my = this.mouseY.value
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Convert screen coordinates to normalized coordinates in range [-1,1]
    const normalizedX = mx / (screenWidth / 2)
    const normalizedY = my / (screenHeight / 2)
    
    // Apply response curve for better control precision
    const curvedX = this.physics.applyResponseCurve(normalizedX)
    const curvedY = this.physics.applyResponseCurve(normalizedY)
    
    // Calculate target rotation values
    const targetRotation = {
      x: -curvedY * SHIP_CONTROLS.ROTATION.X_FACTOR,
      y: -curvedX * SHIP_CONTROLS.ROTATION.Y_FACTOR,
      z: curvedX * SHIP_CONTROLS.ROTATION.Z_FACTOR
    }
    
    // Calculate target position
    const targetPosition = {
      x: curvedX * SHIP_CONTROLS.POSITION.RANGE_X,
      y: -curvedY * SHIP_CONTROLS.POSITION.RANGE_Y + SHIP_CONTROLS.POSITION.OFFSET_Y
    }
    
    // Apply physics system
    this.physics.updatePhysics(targetPosition, targetRotation)
    
    // Update ray data
    this.updateShipRay()

    // Log flight mode updates with throttling
    Logger.throttle('SHIP_CONTROLLER', 'Flight mode update', {
      targetPosition,
      targetRotation,
      mouseInput: { normalizedX, normalizedY }
    })
  }
  
  // Update ship ray
  updateShipRay(): void {
    const { main, position, direction } = this.refs
    
    main.value.getWorldPosition(position)
    main.value.getWorldDirection(direction)
    this.gameStore.mutation.ray.origin.copy(position)
    this.gameStore.mutation.ray.direction.copy(direction.negate())

    // Log ray updates with low probability to avoid spam
    Logger.random('SHIP_CONTROLLER', 'Ship ray updated', {
      origin: { x: position.x, y: position.y, z: position.z },
      direction: { x: direction.x, y: direction.y, z: direction.z }
    }, 0.01)
  }
  
  // Log debug information
  logDebugInfo(): void {
    const { main } = this.refs
    const { velocity } = this.physics.getState()

    Logger.throttle('SHIP_CONTROLLER', 'Ship status', {
      position: {
        x: parseFloat(main.value.position.x.toFixed(2)),
        y: parseFloat(main.value.position.y.toFixed(2))
      },
      velocity: {
        x: parseFloat(velocity.position.x.toFixed(2)),
        y: parseFloat(velocity.position.y.toFixed(2))
      },
      mouse: {
        x: parseFloat(this.mouseX.value.toFixed(2)),
        y: parseFloat(this.mouseY.value.toFixed(2))
      }
    })
  }
}