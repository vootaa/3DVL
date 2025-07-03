/**
 * Simple drift system validator
 * Quick check for common drift issues
 */

import { galaxyDriftConfig } from '../configs/galaxy-drift-config'
import { Logger } from '../../../utils/logger'
import { LoggingConfig } from '../configs/logging-config'
import { Vector3 } from 'three'

export interface DriftValidationResult {
  isValid: boolean
  speedGUS: number
  speedMGUS: number
  positionChangeGU: number
  timeIntervalS: number
  calculatedSpeedGUS: number
  speedMismatch: boolean
  speedMismatchPercent: number
  messages: string[]
}

export class DriftValidator {
  static validateConfiguration(): { isValid: boolean; issues: string[]; suggestions: string[] } {
    const issues: string[] = []
    const suggestions: string[] = []

    try {
      // Check if config is enabled
      if (!galaxyDriftConfig.enabled) {
        issues.push('Drift system is disabled in configuration')
        suggestions.push('Set galaxyDriftConfig.enabled = true to enable drift')
      }

      // Check drift velocities
      const velocity = galaxyDriftConfig.motionPattern.primaryVelocity
      if (velocity.length() < 0.01) {
        issues.push('Primary drift velocity is very small, may not be visible')
        suggestions.push('Consider increasing primaryVelocity values for more visible drift')
      }

      // Check oscillation settings
      const oscillation = galaxyDriftConfig.motionPattern.oscillation
      if (oscillation.amplitude.length() < 0.1) {
        issues.push('Oscillation amplitude is very small')
        suggestions.push('Increase oscillation amplitude for more natural movement')
      }

      // Validate boundary settings
      const boundaries = galaxyDriftConfig.boundaries
      if (boundaries.maxDistance <= 0) {
        issues.push('Invalid boundary max distance')
        suggestions.push('Set boundaries.maxDistance to a positive value')
      }

      return {
        isValid: issues.length === 0,
        issues,
        suggestions
      }
    } catch (error) {
      return {
        isValid: false,
        issues: [`Configuration validation error: ${error}`],
        suggestions: ['Check that galaxy-drift-config.ts is properly imported']
      }
    }
  }

  /**
   * Validate speed calculation consistency
   */
  static validateSpeedCalculation(
    previousPosition: Vector3,
    currentPosition: Vector3,
    timeIntervalS: number,
    reportedSpeedMGUS: number
  ): DriftValidationResult {
    const messages: string[] = []
    
    // Calculate position change in GU
    const positionChangeGU = currentPosition.distanceTo(previousPosition)
    
    // Calculate expected speed in GU/s
    const calculatedSpeedGUS = timeIntervalS > 0 ? positionChangeGU / timeIntervalS : 0
    
    // Convert reported speed from mGU/s to GU/s
    const reportedSpeedGUS = reportedSpeedMGUS / 1000
    
    // Check for speed mismatch
    const speedDifference = Math.abs(calculatedSpeedGUS - reportedSpeedGUS)
    const speedMismatchPercent = calculatedSpeedGUS > 0 ? (speedDifference / calculatedSpeedGUS) * 100 : 0
    const speedMismatch = speedMismatchPercent > 5.0 // Allow 5% tolerance for floating point errors
    
    // Validation messages
    messages.push(`Position change: ${positionChangeGU.toFixed(8)} GU`)
    messages.push(`Time interval: ${timeIntervalS.toFixed(4)} s`)
    messages.push(`Calculated speed: ${calculatedSpeedGUS.toFixed(8)} GU/s`)
    messages.push(`Reported speed: ${reportedSpeedGUS.toFixed(8)} GU/s (${reportedSpeedMGUS.toFixed(6)} mGU/s)`)
    
    if (speedMismatch) {
      messages.push(`⚠️ Speed mismatch: ${speedMismatchPercent.toFixed(2)}% difference`)
    } else {
      messages.push(`✅ Speed calculation valid (${speedMismatchPercent.toFixed(2)}% difference)`)
    }
    
    return {
      isValid: !speedMismatch,
      speedGUS: reportedSpeedGUS,
      speedMGUS: reportedSpeedMGUS,
      positionChangeGU,
      timeIntervalS,
      calculatedSpeedGUS,
      speedMismatch,
      speedMismatchPercent,
      messages
    }
  }

  /**
   * Monitor live drift data for validation
   */
  static monitorLiveDrift() {
    if (typeof window === 'undefined') return

    let lastPosition: Vector3 | null = null
    let lastTime = 0

    const checkDriftState = () => {
      const driftState = (window as any).__CURRENT_DRIFT_STATE__
      
      if (!driftState || !driftState.position) {
        Logger.throttle('DRIFT_VALIDATOR_MONITOR', 'No live drift state available', {}, LoggingConfig.DRIFT_DEBUG)
        return
      }

      const currentPosition = new Vector3(
        driftState.position.x,
        driftState.position.y,
        driftState.position.z
      )
      const currentTime = driftState.lastUpdate

      if (lastPosition && lastTime && currentTime > lastTime) {
        const timeInterval = (currentTime - lastTime) / 1000 // Convert to seconds
        const reportedSpeed = typeof driftState.velocity === 'number' ? driftState.velocity * 1000 : 0 // Convert to mGU/s

        const validation = this.validateSpeedCalculation(
          lastPosition,
          currentPosition,
          timeInterval,
          reportedSpeed
        )

        Logger.throttle('DRIFT_VALIDATOR_LIVE', 'Live drift validation', {
          validation,
          driftState: {
            position: driftState.position,
            velocity: driftState.velocity,
            totalDistance: driftState.totalDistance,
            isActive: driftState.isActive
          }
        }, LoggingConfig.DRIFT_DEBUG)
      }

      lastPosition = currentPosition.clone()
      lastTime = currentTime
    }
    
    // Check drift state every 5 seconds
    setInterval(checkDriftState, 5000)
    checkDriftState() // Initial check
  }

  static quickDiagnostic(): void {
    Logger.log('DRIFT_VALIDATOR', 'Starting quick diagnostic...')
    
    const validation = this.validateConfiguration()
    
    if (validation.issues.length > 0) {
      Logger.warn('DRIFT_VALIDATOR', 'Issues found:', validation.issues)
      Logger.log('DRIFT_VALIDATOR', 'Suggestions:', validation.suggestions)
    } else {
      Logger.log('DRIFT_VALIDATOR', 'Configuration appears valid')
    }

    // Start live drift monitoring
    this.monitorLiveDrift()

    // Expose config to window for debugging
    if (typeof window !== 'undefined') {
      const configToExpose = {
        enabled: galaxyDriftConfig.enabled,
        primaryVelocity: {
          x: galaxyDriftConfig.motionPattern.primaryVelocity.x,
          y: galaxyDriftConfig.motionPattern.primaryVelocity.y,
          z: galaxyDriftConfig.motionPattern.primaryVelocity.z
        },
        showTrail: galaxyDriftConfig.showTrail
      };
      (window as any).__DRIFT_CONFIG__ = configToExpose;
      (window as any).driftValidator = this;
      Logger.throttle('DRIFT_VALIDATOR', 'Config exposed to window.__DRIFT_CONFIG__ for debugging', {}, LoggingConfig.DRIFT_DEBUG)
    }
  }
}

// Auto-run diagnostic in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    DriftValidator.quickDiagnostic()
  }, 5000) // 5 seconds delay instead of using config interval
}

export default DriftValidator
