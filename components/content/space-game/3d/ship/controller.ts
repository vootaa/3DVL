import type { ComputedRef } from 'vue'
import { ShipPhysics } from './physics'
import { SHIP_CONTROLS } from './config'
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
  }
  
  // 获取物理状态
  getPhysicsState(): ShipControlState {
    return this.physics.getState()
  }
  
  // 处理浮动效果
  handleFloatEffect(time: number): void {
    this.refs.main.value.position.z = Math.sin(time * SHIP_CONTROLS.FLOAT_EFFECT.FREQUENCY) * 
                                      Math.PI * SHIP_CONTROLS.FLOAT_EFFECT.AMPLITUDE
  }
  
  // 处理观察模式
  handleObservationMode(time: number): void {
    const { main } = this.refs
    const resetRate = SHIP_CONTROLS.OBSERVATION.RESET_RATE
    
    // 缓慢重置旋转
    main.value.rotation.z -= main.value.rotation.z * resetRate
    main.value.rotation.x -= main.value.rotation.x * resetRate
    main.value.rotation.y -= main.value.rotation.y * resetRate
    
    // 缓慢重置位置
    main.value.position.x -= main.value.position.x * resetRate
    main.value.position.y += (25 - main.value.position.y) * resetRate
    
    // 悬停效果
    const period = SHIP_CONTROLS.OBSERVATION.HOVER_PERIOD
    const amplitude = SHIP_CONTROLS.OBSERVATION.HOVER_AMPLITUDE
    main.value.position.x += Math.sin(time / period) * amplitude
    main.value.position.y += Math.cos(time / period * 1.3) * amplitude
    
    // 重置惯性
    this.physics.resetForces()
  }
  
  // 处理飞行模式
  handleFlightMode(): void {
    const mx = this.mouseX.value
    const my = this.mouseY.value
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // 将屏幕坐标转换为[-1,1]范围内的归一化坐标
    const normalizedX = mx / (screenWidth / 2)
    const normalizedY = my / (screenHeight / 2)
    
    // 应用响应曲线，提高控制精度
    const curvedX = this.physics.applyResponseCurve(normalizedX)
    const curvedY = this.physics.applyResponseCurve(normalizedY)
    
    // 计算目标旋转值
    const targetRotation = {
      x: -curvedY * SHIP_CONTROLS.ROTATION.X_FACTOR,
      y: -curvedX * SHIP_CONTROLS.ROTATION.Y_FACTOR,
      z: curvedX * SHIP_CONTROLS.ROTATION.Z_FACTOR
    }
    
    // 计算目标位置
    const targetPosition = {
      x: curvedX * SHIP_CONTROLS.POSITION.RANGE_X,
      y: -curvedY * SHIP_CONTROLS.POSITION.RANGE_Y + SHIP_CONTROLS.POSITION.OFFSET_Y
    }
    
    // 应用物理系统
    this.physics.updatePhysics(targetPosition, targetRotation)
    
    // 更新射线数据
    this.updateShipRay()
  }
  
  // 更新飞船射线
  updateShipRay(): void {
    const { main, position, direction } = this.refs
    
    main.value.getWorldPosition(position)
    main.value.getWorldDirection(direction)
    this.gameStore.mutation.ray.origin.copy(position)
    this.gameStore.mutation.ray.direction.copy(direction.negate())
  }
  
  // 记录调试信息
  logDebugInfo(): void {
    const { lastLogTime } = this.physics.getState()
    
    if (!SHIP_CONTROLS.DEV.LOG_ENABLED) return
    
    const now = Date.now()
    if (now - lastLogTime > SHIP_CONTROLS.DEV.LOG_INTERVAL) {
      const { main } = this.refs
      const { velocity } = this.physics.getState()
      
      console.log('Ship status:', {
        position: { 
          x: main.value.position.x.toFixed(2), 
          y: main.value.position.y.toFixed(2) 
        },
        velocity: { 
          x: velocity.position.x.toFixed(2), 
          y: velocity.position.y.toFixed(2) 
        },
        mouse: { 
          x: this.mouseX.value.toFixed(2), 
          y: this.mouseY.value.toFixed(2) 
        }
      })
      
      this.physics.getState().lastLogTime = now
    }
  }
}