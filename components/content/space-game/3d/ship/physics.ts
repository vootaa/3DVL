import { reactive } from 'vue'
import { SHIP_CONTROLS } from './config'
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
  
  // 获取物理引擎状态
  getState(): ShipControlState {
    return this.state
  }
  
  // 非线性响应曲线映射函数
  applyResponseCurve(value: number, exponent = SHIP_CONTROLS.POSITION.RESPONSE_CURVE): number {
    // 保持符号，对绝对值应用指数，实现非线性映射
    return Math.sign(value) * Math.pow(Math.abs(value), exponent)
  }
  
  // 重置物理状态
  resetForces(damping = 0.9): void {
    this.state.velocity.position.x *= damping
    this.state.velocity.position.y *= damping
    this.state.velocity.rotation.x *= damping
    this.state.velocity.rotation.y *= damping
    this.state.velocity.rotation.z *= damping
  }
  
  // 物理更新函数
  updatePhysics(targetPos: { x: number, y: number }, targetRot: { x: number, y: number, z: number }): void {
    const { main } = this.refs
    const { velocity } = this.state
    
    // 位置物理计算
    const posForceX = (targetPos.x - main.value.position.x) * SHIP_CONTROLS.PHYSICS.RETURN_FORCE
    const posForceY = (targetPos.y - main.value.position.y) * SHIP_CONTROLS.PHYSICS.RETURN_FORCE
    
    velocity.position.x = velocity.position.x * SHIP_CONTROLS.PHYSICS.DAMPING + posForceX / SHIP_CONTROLS.PHYSICS.MASS
    velocity.position.y = velocity.position.y * SHIP_CONTROLS.PHYSICS.DAMPING + posForceY / SHIP_CONTROLS.PHYSICS.MASS
    
    main.value.position.x += velocity.position.x
    main.value.position.y += velocity.position.y
    
    // 旋转物理计算
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