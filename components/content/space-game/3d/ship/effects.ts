import { Color } from 'three'
import type { ShipRefs } from './types'
import type { GameStore } from '../../GameStore' 
import { gameStateManager } from '../../core/GameStateManager'

export class ShipVisualEffects {
  private refs: ShipRefs
  private gameStore: GameStore
  private lightgreen: Color
  private hotpink: Color
  private crossMaterial: any
  
  constructor(refs: ShipRefs, gameStore: GameStore, crossMaterial: any) {
    this.refs = refs
    this.gameStore = gameStore
    this.crossMaterial = crossMaterial
    this.lightgreen = new Color('lightgreen')
    this.hotpink = new Color('hotpink')
  }
  
  // 更新所有视觉效果
  updateVisualEffects(time: number): void {
    this.updateExhaust(time)
    this.updateLasers()
    this.updateLaserLight()
    this.updateHUDElements()
  }
  
  // 更新引擎尾焰
  private updateExhaust(time: number): void {
    const { exhaust } = this.refs
    if (exhaust?.value) {
      exhaust.value.scale.x = 1 + Math.sin(time * 200)
      exhaust.value.scale.y = 1 + Math.sin(time * 200)
    }
  }
  
  // 更新激光
  private updateLasers(): void {
    const { laserGroup } = this.refs
    if (Array.isArray(laserGroup.value)) {
      for (const g of laserGroup.value) {
        g.position.z -= 20
      }
    }
  }
  
  // 更新激光光效
  private updateLaserLight(): void {
    const { laserLight } = this.refs
    const laserActive = this.gameStore.lasers.length && 
                      Date.now() - this.gameStore.lasers[this.gameStore.lasers.length - 1] < 100
    
    const targetIntensity = laserActive ? 200000 : 0
    if (laserLight.value) {
      laserLight.value.intensity += (targetIntensity - laserLight.value.intensity) * 0.3
    }
  }
  
  // 更新HUD元素
  private updateHUDElements(): void {
    const { cross, target } = this.refs
    
    // 根据命中状态设置准心颜色
    if (this.crossMaterial) {
      this.crossMaterial.color = this.gameStore.mutation.hits ? 
        this.lightgreen : this.hotpink
    }
    
    // 战斗模式下显示准心
    if (cross.value) {
      cross.value.visible = gameStateManager.isBattleMode() && !this.gameStore.mutation.hits
    }
    
    // 战斗模式下显示目标指示器
    if (target.value) {
      target.value.visible = gameStateManager.isBattleMode() && !!this.gameStore.mutation.hits
    }
  }
}