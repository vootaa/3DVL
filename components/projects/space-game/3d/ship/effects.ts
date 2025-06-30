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
  
  // Update all visual effects
  updateVisualEffects(time: number): void {
    this.updateExhaust(time)
    this.updateLasers()
    this.updateLaserLight()
    this.updateHUDElements()
  }
  
  // Update engine exhaust
  private updateExhaust(time: number): void {
    const { exhaust } = this.refs
    if (exhaust?.value) {
      exhaust.value.scale.x = 1 + Math.sin(time * 200)
      exhaust.value.scale.y = 1 + Math.sin(time * 200)
    }
  }
  
  // Update lasers
  private updateLasers(): void {
    const { laserGroup } = this.refs
    if (Array.isArray(laserGroup.value)) {
      for (const g of laserGroup.value) {
        g.position.z -= 20
      }
    }
  }
  
  // Update laser light effects
  private updateLaserLight(): void {
    const { laserLight } = this.refs
    const laserActive = this.gameStore.lasers.length && 
                      Date.now() - this.gameStore.lasers[this.gameStore.lasers.length - 1] < 100
    
    const targetIntensity = laserActive ? 200000 : 0
    if (laserLight.value) {
      laserLight.value.intensity += (targetIntensity - laserLight.value.intensity) * 0.3
    }
  }
  
  // Update HUD elements
  private updateHUDElements(): void {
    const { cross, target } = this.refs
    
    // Set crosshair color based on hit status
    if (this.crossMaterial) {
      this.crossMaterial.color = this.gameStore.mutation.hits ? 
        this.lightgreen : this.hotpink
    }
    
    // Display crosshair in battle mode
    if (cross.value) {
      cross.value.visible = gameStateManager.isBattleMode() && !this.gameStore.mutation.hits
    }
    
    // Display target indicator in battle mode
    if (target.value) {
      target.value.visible = gameStateManager.isBattleMode() && !!this.gameStore.mutation.hits
    }
  }
}