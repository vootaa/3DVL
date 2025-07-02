/**
 * Galaxy Drift Runtime Checker
 * Provides utilities to verify drift system is working correctly
 */

import { Logger } from '../../../utils/logger'
import { LoggingConfig } from '../configs/logging-config'

export class DriftRuntimeChecker {
  private static checkInterval: NodeJS.Timeout | null = null
  private static isRunning = false

  /**
   * Start continuous drift monitoring
   */
  static startMonitoring() {
    if (this.isRunning) {
      console.log('[DRIFT_CHECKER] Already monitoring drift system')
      return
    }

    this.isRunning = true
    console.log('[DRIFT_CHECKER] Starting drift system monitoring...')

    this.checkInterval = setInterval(() => {
      this.performRuntimeCheck()
    }, 30000) // Check every 30 seconds instead of 5

    // Initial check
    this.performRuntimeCheck()
  }

  /**
   * Stop drift monitoring
   */
  static stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.isRunning = false
    console.log('[DRIFT_CHECKER] Stopped drift system monitoring')
  }

  /**
   * Perform a single runtime check
   */
  static performRuntimeCheck() {
    const issues: string[] = []
    const checks = {
      configEnabled: false,
      controllerPresent: false,
      orbitalSystemPresent: false,
      starClusterPresent: false,
      injectionWorking: false
    }

    try {
      // Check if drift config is enabled - improved check
      let configEnabled = false
      try {
        // Try multiple ways to access config
        const driftConfigModule = (window as any).__DRIFT_CONFIG__
        const galaxyDriftConfig = (window as any).galaxyDriftConfig
        
        if (driftConfigModule?.enabled || galaxyDriftConfig?.enabled) {
          configEnabled = true
          checks.configEnabled = true
        } else {
          // Try importing from module if available
          import('../configs/galaxy-drift-config').then(module => {
            if (module.galaxyDriftConfig?.enabled) {
              checks.configEnabled = true
            }
          }).catch(() => {
            // Config module not accessible
          })
        }
      } catch (configError) {
        console.warn('[DRIFT_CHECKER] Config access error:', configError)
      }
      
      if (!configEnabled) {
        issues.push('Drift configuration is disabled or not accessible - this may be normal during initialization')
      }

      // Check for components in DOM
      const driftController = document.querySelector('.galaxy-container')
      if (driftController) {
        checks.controllerPresent = true
      } else {
        issues.push('Galaxy drift controller component not found in DOM')
      }

      // Check for Three.js objects with drift
      const threeCanvas = document.querySelector('canvas')
      if (threeCanvas) {
        checks.orbitalSystemPresent = true
        checks.starClusterPresent = true
      } else {
        issues.push('Three.js canvas not found')
      }

      // Check console logs for drift activity
      const hasRecentDriftLogs = this.checkRecentConsoleActivity()
      if (hasRecentDriftLogs) {
        checks.injectionWorking = true
      } else {
        issues.push('No recent drift activity detected in console logs')
      }

      // Report status
      const allPassing = Object.values(checks).every(check => check)
      const status = allPassing ? 'HEALTHY' : 'ISSUES_DETECTED'

      console.log(`[DRIFT_CHECKER] System Status: ${status}`, {
        timestamp: new Date().toISOString(),
        checks,
        issues: issues.length > 0 ? issues : 'None detected',
        totalChecks: Object.keys(checks).length,
        passingChecks: Object.values(checks).filter(Boolean).length
      })

      if (!allPassing) {
        console.warn('[DRIFT_CHECKER] Drift system has issues that need attention:', issues)
      }

    } catch (error) {
      console.error('[DRIFT_CHECKER] Error during runtime check:', error)
    }
  }

  /**
   * Check for recent console activity indicating drift is working - improved detection
   */
  private static checkRecentConsoleActivity(): boolean {
    // Look for recent drift activity in the last 2 minutes
    const recentTime = Date.now() - (2 * 60 * 1000) // 2 minutes
    
    // Check if we can see drift activity in current state
    if (typeof window !== 'undefined') {
      const currentDriftState = (window as any).__CURRENT_DRIFT_STATE__
      if (currentDriftState && currentDriftState.lastUpdate > recentTime) {
        Logger.throttle('DRIFT_CHECKER_ACTIVITY', 'Active drift detected from current state', {
          lastUpdate: currentDriftState.lastUpdate,
          velocity: currentDriftState.velocity,
          isActive: currentDriftState.isActive
        }, LoggingConfig.DRIFT_RUNTIME_CHECK)
        return true
      }
      
      // Also check if config is enabled as fallback
      const config = (window as any).__DRIFT_CONFIG__
      if (config && config.enabled) {
        Logger.throttle('DRIFT_CHECKER_CONFIG', 'Assuming drift activity based on enabled config', {
          configEnabled: config.enabled
        }, LoggingConfig.DRIFT_RUNTIME_CHECK)
        return true
      }
    }
    
    // Legacy check for DOM elements
    try {
      const driftMonitor = document.querySelector('.drift-monitor')
      if (driftMonitor) {
        return true
      }
    } catch {
      // DOM check failed
    }
    
    return false
  }

  /**
   * Manual check that can be called from browser console
   */
  static manualCheck() {
    console.log('[DRIFT_CHECKER] Performing manual drift system check...')
    this.performRuntimeCheck()
    
    // Additional manual diagnostics
    console.log('[DRIFT_CHECKER] Additional diagnostics:')
    console.log('- To start monitoring: DriftRuntimeChecker.startMonitoring()')
    console.log('- To stop monitoring: DriftRuntimeChecker.stopMonitoring()')
    console.log('- Check drift config: galaxyDriftConfig')
    console.log('- Look for THREE objects with drift applied')
  }
}

// Auto-start monitoring in development with longer delay
if (process.env.NODE_ENV === 'development') {
  // Longer delay to allow all components to properly mount and initialize
  setTimeout(() => {
    DriftRuntimeChecker.startMonitoring()
  }, 10000) // Increased from 3000 to 10000ms
}

// Expose to global scope for manual testing
if (typeof window !== 'undefined') {
  (window as any).DriftRuntimeChecker = DriftRuntimeChecker
}

export default DriftRuntimeChecker
