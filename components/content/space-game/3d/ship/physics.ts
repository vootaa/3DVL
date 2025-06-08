import { reactive } from 'vue'
import { Logger } from '../../core/logger'
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

    Logger.log('SHIP_PHYSICS', 'Physics engine initialized')
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

    Logger.throttle('SHIP_PHYSICS', 'Forces reset', {
      damping,
      velocityAfterReset: {
        position: { x: this.state.velocity.position.x, y: this.state.velocity.position.y },
        rotation: { x: this.state.velocity.rotation.x, y: this.state.velocity.rotation.y, z: this.state.velocity.rotation.z }
      }
    })
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

    // Log physics updates with throttling to avoid performance impact
    Logger.throttle('SHIP_PHYSICS', 'Physics update', {
      target: { position: targetPos, rotation: targetRot },
      current: {
        position: { x: main.value.position.x, y: main.value.position.y },
        rotation: { x: main.value.rotation.x, y: main.value.rotation.y, z: main.value.rotation.z }
      },
      velocity: {
        position: { x: velocity.position.x, y: velocity.position.y },
        rotation: { x: velocity.rotation.x, y: velocity.rotation.y, z: velocity.rotation.z }
      },
      forces: {
        position: { x: posForceX, y: posForceY },
        rotation: { x: rotForceX, y: rotForceY, z: rotForceZ }
      }
    })
  }

  // Collision detection helper
  checkCollisionBounds(): boolean {
    const { main } = this.refs
    const position = main.value.position

    // Define collision boundaries
    const bounds = {
      minX: -100, maxX: 100,
      minY: -100, maxY: 100
    }

    const hasCollision = (
      position.x < bounds.minX || position.x > bounds.maxX ||
      position.y < bounds.minY || position.y > bounds.maxY
    )

    if (hasCollision) {
      Logger.log('SHIP_PHYSICS', 'Collision detected', {
        position: { x: position.x, y: position.y },
        bounds,
        violatedBounds: {
          x: position.x < bounds.minX ? 'minX' : position.x > bounds.maxX ? 'maxX' : null,
          y: position.y < bounds.minY ? 'minY' : position.y > bounds.maxY ? 'maxY' : null
        }
      })
    }

    return hasCollision
  }

  // Get physics performance metrics
  getPerformanceMetrics(): object {
    const { velocity } = this.state
    const totalVelocity = Math.sqrt(
      velocity.position.x ** 2 + velocity.position.y ** 2
    )
    const totalRotationalVelocity = Math.sqrt(
      velocity.rotation.x ** 2 + velocity.rotation.y ** 2 + velocity.rotation.z ** 2
    )

    const metrics = {
      totalVelocity: parseFloat(totalVelocity.toFixed(4)),
      totalRotationalVelocity: parseFloat(totalRotationalVelocity.toFixed(4)),
      isStable: totalVelocity < 0.001 && totalRotationalVelocity < 0.001
    }

    Logger.random('SHIP_PHYSICS', 'Performance metrics', metrics, 0.02)

    return metrics
  }
}