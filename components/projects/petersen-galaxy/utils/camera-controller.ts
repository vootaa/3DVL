import { Vector3 } from 'three'
import type { Ref } from 'vue'

/**
 * Camera controller utility for adjusting camera position and angle
 * when grid helper is enabled to prevent grid overlay on orbital paths
 */
export class CameraController {
  private cameraRef: Ref
  private controlsRef: Ref
  private onComplete?: () => void

  constructor(cameraRef: Ref, controlsRef: Ref) {
    this.cameraRef = cameraRef
    this.controlsRef = controlsRef
  }

  /**
   * Adjusts camera to optimal viewing position for grid display:
   * - Distance: 10.00AU (maximum distance)
   * - Elevation: 2 degrees (slight overhead view)
   * - Maintains current azimuth angle
   */
  adjustForGrid(onComplete?: () => void): void {
    this.onComplete = onComplete
    
    // Small delay to ensure components are ready
    setTimeout(() => {
      const camera = this.cameraRef.value
      const controls = this.controlsRef.value
      
      if (camera) {
        const currentPos = camera.position.clone()
        
        // Target: 10.00AU distance, 2-degree elevation
        const targetDistance = 10.0 // Maximum distance
        
        // Preserve current azimuth angle (left-right direction)
        const currentAzimuth = Math.atan2(currentPos.x, currentPos.z)
        
        // Calculate target position
        const targetPos = this.calculateTargetPosition(targetDistance, currentAzimuth)
        
        // Start smooth animation
        this.animateToPosition(camera, controls, currentPos, targetPos)
      }
    }, 100)
  }

  /**
   * Calculates target camera position based on distance and azimuth
   */
  private calculateTargetPosition(distance: number, azimuth: number): Vector3 {
    // For 2-degree elevation: tan(2°) ≈ 0.0349
    const targetY = distance * 0.035 // Y coordinate for 2-degree elevation
    
    // Calculate horizontal distance in XZ plane
    const horizontalDistance = Math.sqrt(distance * distance - targetY * targetY)
    
    // Calculate X and Z coordinates based on azimuth
    const targetX = horizontalDistance * Math.sin(azimuth)
    const targetZ = horizontalDistance * Math.cos(azimuth)
    
    return new Vector3(targetX, targetY, targetZ)
  }

  /**
   * Animates camera from current position to target position
   */
  private animateToPosition(
    camera: any, 
    controls: any, 
    startPos: Vector3, 
    targetPos: Vector3
  ): void {
    const duration = 1200 // Animation duration in milliseconds
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Smooth easing (ease-in-out)
      const easedProgress = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
      
      // Interpolate position
      const currentPosition = startPos.clone().lerp(targetPos, easedProgress)
      camera.position.copy(currentPosition)
      camera.lookAt(0, 0, 0)
      
      // Update controls
      if (controls && controls.update) {
        controls.update()
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Animation completed
        if (this.onComplete) {
          this.onComplete()
        }
      }
    }
    
    animate()
  }
}
