/**
 * Simple drift system validator
 * Quick check for common drift issues
 */

import { galaxyDriftConfig } from '../configs/galaxy-drift-config'

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
    console.log('[DRIFT_VALIDATOR] Starting quick diagnostic...')
    
    const validation = this.validateConfiguration()
    
    console.log('[DRIFT_VALIDATOR] Configuration Status:', {
      isValid: validation.isValid,
      totalIssues: validation.issues.length,
      configEnabled: galaxyDriftConfig.enabled,
      primaryVelocity: galaxyDriftConfig.motionPattern.primaryVelocity,
      timestamp: new Date().toISOString()
    })

    if (validation.issues.length > 0) {
      console.warn('[DRIFT_VALIDATOR] Issues found:', validation.issues)
      console.info('[DRIFT_VALIDATOR] Suggestions:', validation.suggestions)
    } else {
      console.log('[DRIFT_VALIDATOR] ✅ Configuration appears valid')
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
      console.log('[DRIFT_VALIDATOR] Config exposed to window.__DRIFT_CONFIG__ for debugging')
    }
  }
}

// Auto-run diagnostic in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    DriftValidator.quickDiagnostic()
  }, 1000) // Run early to set up window.__DRIFT_CONFIG__
}

export default DriftValidator
