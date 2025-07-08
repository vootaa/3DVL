import { Vector3 } from 'three'
import type { Ref } from 'vue'
import { Logger } from '../../../utils/logger'

/**
 * Camera controller utility for adjusting camera position and angle
 * when grid helper is enabled to prevent grid overlay on orbital paths
 */
export class CameraController {
  private cameraRef: Ref
  private controlsRef: Ref
  private onComplete?: () => void
  private isAnimating: boolean = false

  constructor(cameraRef: Ref, controlsRef: Ref) {
    this.cameraRef = cameraRef
    this.controlsRef = controlsRef
  }

  /**
   * Adjusts camera to optimal viewing position for grid display:
   * - Distance: 10.00AU (maximum distance)
   * - Elevation: 10 degrees (slight overhead view)
   * - Maintains current azimuth angle
   * 
   * If camera is already at target position, skips animation for immediate response
   */
  adjustForGrid(onComplete?: () => void): void {
    // Prevent overlapping animations
    if (this.isAnimating) {
      Logger.log('CAMERA_CONTROLLER', 'Animation already in progress, skipping...')
      return
    }

    this.onComplete = onComplete
    
    // Small delay to ensure components are ready
    setTimeout(() => {
      const camera = this.cameraRef.value
      const controls = this.controlsRef.value
      
      if (camera) {
        const currentPos = camera.position.clone()
        
        // Target: 10.00AU distance, 10-degree elevation
        const targetDistance = 10.0 // Maximum distance
        
        // Preserve current azimuth angle (left-right direction)
        const currentAzimuth = Math.atan2(currentPos.x, currentPos.z)
        
        // Calculate target position
        const targetPos = this.calculateTargetPosition(targetDistance, currentAzimuth)
        
        // Check if camera is already at target position (within tolerance)
        if (this.isAtTargetPosition(currentPos, targetPos)) {
          // Camera is already in position, no animation needed
          Logger.log('CAMERA_CONTROLLER', 'Camera already at target position - showing grid immediately')
          if (this.onComplete) {
            this.onComplete()
          }
          return
        }
        
        // Start smooth animation
        this.isAnimating = true
        this.animateToPosition(camera, controls, currentPos, targetPos)
      }
    }, 100)
  }

  /**
   * Checks if camera is already at the target position within tolerance
   */
  private isAtTargetPosition(currentPos: Vector3, targetPos: Vector3): boolean {
    // Calculate actual distances and angles from both positions
    const currentDistance = currentPos.length()
    const targetDistance = targetPos.length()
    const distanceTolerance = 0.3 // 0.3 AU tolerance
    
    // Calculate elevation angles for both positions
    const currentElevation = Math.asin(currentPos.y / currentDistance) * (180 / Math.PI)
    const targetElevation = Math.asin(targetPos.y / targetDistance) * (180 / Math.PI)
    const angleTolerance = 2 // 2 degrees tolerance
    
    // Also check direct 3D distance between positions as an additional check
    const directDistance = currentPos.distanceTo(targetPos)
    const directDistanceTolerance = 0.5 // 0.5 AU tolerance for direct 3D distance
    
    const distanceMatch = Math.abs(currentDistance - targetDistance) <= distanceTolerance
    const elevationMatch = Math.abs(currentElevation - targetElevation) <= angleTolerance
    const directDistanceMatch = directDistance <= directDistanceTolerance
    
    Logger.throttle('CAMERA_CONTROLLER', `Camera position check:
      Current distance: ${currentDistance.toFixed(2)} AU (target: ${targetDistance.toFixed(2)} AU)
      Current elevation: ${currentElevation.toFixed(1)}° (target: ${targetElevation.toFixed(1)}°)
      Direct 3D distance: ${directDistance.toFixed(2)} AU
      Distance match: ${distanceMatch}, Elevation match: ${elevationMatch}, Direct match: ${directDistanceMatch}`)
    
    // Camera is considered at target if it meets distance/elevation criteria OR is very close in 3D space
    return (distanceMatch && elevationMatch) || directDistanceMatch
  }

  /**
   * Calculates target camera position based on distance and azimuth
   */
  private calculateTargetPosition(distance: number, azimuth: number): Vector3 {
    // For 10-degree elevation: tan(10°) ≈ 0.176
    const targetElevationDegrees = 10
    const targetElevationRadians = targetElevationDegrees * (Math.PI / 180)
    const targetY = distance * Math.tan(targetElevationRadians) // Y coordinate for target elevation
    
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
        this.isAnimating = false
        if (this.onComplete) {
          this.onComplete()
        }
      }
    }
    
    animate()
  }
  
  /**
   * Returns whether camera is currently animating
   */
  isCurrentlyAnimating(): boolean {
    return this.isAnimating
  }
}
