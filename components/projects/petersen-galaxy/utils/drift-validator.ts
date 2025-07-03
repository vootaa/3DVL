/**
 * Simple drift system validator
 * Quick check for common drift issues
 */

import { galaxyDriftConfig } from '../configs/galaxy-drift-config'
import { Logger } from '../../../utils/logger'
import { LoggingConfig } from '../configs/logging-config'

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

  static quickDiagnostic(): void {
    Logger.throttle('DRIFT_VALIDATOR', 'Starting quick diagnostic...', {}, LoggingConfig.DRIFT_DEBUG)
    
    const validation = this.validateConfiguration()
    
    Logger.throttle('DRIFT_VALIDATOR', 'Configuration Status:', {
      isValid: validation.isValid,
      totalIssues: validation.issues.length,
      configEnabled: galaxyDriftConfig.enabled,
      primaryVelocity: galaxyDriftConfig.motionPattern.primaryVelocity,
      timestamp: new Date().toISOString()
    }, LoggingConfig.DRIFT_DEBUG)

    if (validation.issues.length > 0) {
      Logger.warn('DRIFT_VALIDATOR', 'Issues found:', validation.issues)
      Logger.info('DRIFT_VALIDATOR', 'Suggestions:', validation.suggestions)
    } else {
      Logger.throttle('DRIFT_VALIDATOR', 'Configuration appears valid', {}, LoggingConfig.DRIFT_DEBUG)
    }

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
  }, LoggingConfig.DRIFT_DEBUG) // Use config interval instead of fixed 1000ms
}

export default DriftValidator
