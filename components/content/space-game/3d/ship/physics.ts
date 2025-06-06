import { reactive } from 'vue'
import { SHIP_CONTROLS } from './constants'
import type { ShipRefs, ShipControlState } from './types'

export class ShipPhysics {
  private refs: ShipRefs
  private state: ShipControlState
  
  constructor(refs: ShipRefs) {
    this.refs = refs
    this.state = {
      velocity: reactive({
        position: { x: 0, y: 0 },
        rotation: { x: 0, y: 0, z: 0 }
      }),
      lastLogTime: 0
    }
  }
  
  // Get physics engine state
  getState(): ShipControlState {
    return this.state
  }
  
  // Non-linear response curve mapping function
  applyResponseCurve(value: number, exponent = SHIP_CONTROLS.POSITION.RESPONSE_CURVE): number {
    // Preserve sign, apply exponent to absolute value, implementing non-linear mapping
    return Math.sign(value) * Math.pow(Math.abs(value), exponent)
  }
  
  // Reset physics state
  resetForces(damping = 0.9): void {
    this.state.velocity.position.x *= damping
    this.state.velocity.position.y *= damping
    this.state.velocity.rotation.x *= damping
    this.state.velocity.rotation.y *= damping
    this.state.velocity.rotation.z *= damping
  }
  
  // Physics update function
  updatePhysics(targetPos: { x: number, y: number }, targetRot: { x: number, y: number, z: number }): void {
    const { main } = this.refs
    const { velocity } = this.state
    
    // Position physics calculation
    const posForceX = (targetPos.x - main.value.position.x) * SHIP_CONTROLS.PHYSICS.RETURN_FORCE
    const posForceY = (targetPos.y - main.value.position.y) * SHIP_CONTROLS.PHYSICS.RETURN_FORCE
    
    velocity.position.x = velocity.position.x * SHIP_CONTROLS.PHYSICS.DAMPING + posForceX / SHIP_CONTROLS.PHYSICS.MASS
    velocity.position.y = velocity.position.y * SHIP_CONTROLS.PHYSICS.DAMPING + posForceY / SHIP_CONTROLS.PHYSICS.MASS
    
    main.value.position.x += velocity.position.x
    main.value.position.y += velocity.position.y
    
    // Rotation physics calculation
    const rotForceX = (targetRot.x - main.value.rotation.x) * SHIP_CONTROLS.PHYSICS.RETURN_FORCE
    const rotForceY = (targetRot.y - main.value.rotation.y) * SHIP_CONTROLS.PHYSICS.RETURN_FORCE
    const rotForceZ = (targetRot.z - main.value.rotation.z) * SHIP_CONTROLS.PHYSICS.RETURN_FORCE
    
    velocity.rotation.x = velocity.rotation.x * SHIP_CONTROLS.PHYSICS.DAMPING + rotForceX / SHIP_CONTROLS.PHYSICS.MASS
    velocity.rotation.y = velocity.rotation.y * SHIP_CONTROLS.PHYSICS.DAMPING + rotForceY / SHIP_CONTROLS.PHYSICS.MASS
    velocity.rotation.z = velocity.rotation.z * SHIP_CONTROLS.PHYSICS.DAMPING + rotForceZ / SHIP_CONTROLS.PHYSICS.MASS
    
    main.value.rotation.x += velocity.rotation.x
    main.value.rotation.y += velocity.rotation.y
    main.value.rotation.z += velocity.rotation.z
  }
}