/**
 * Unified logging configuration for Petersen Galaxy project
 * Centralizes all log intervals and categories for easy management
 */

export const LoggingConfig = {
  // Main drift system intervals (in milliseconds)
  intervals: {
    driftDebug: 15000,            // Main drift debugging - 15 seconds
    orbitalDrift: 45000,          // Orbital system drift application - 45 seconds
    starClusterDrift: 45000,      // Star cluster drift application - 45 seconds
    driftMonitorUpdate: 10000,    // Debug panel updates - 10 seconds
    driftCheck: 60000,            // Runtime system checks - 60 seconds
    cameraController: 10000,      // Camera movement logs - 10 seconds
    driftInjectionCheck: 30000,   // Dependency injection validation - 30 seconds
    performanceMetrics: 120000,   // Performance logs - 120 seconds
  },
  
  // Legacy support - to be deprecated
  DRIFT_DEBUG: 15000,
  ORBITAL_DRIFT: 45000,
  STAR_CLUSTER_DRIFT: 45000,
  DRIFT_MONITOR_UPDATE: 10000,
  DRIFT_RUNTIME_CHECK: 60000,
  CAMERA_CONTROLLER: 10000,
  DRIFT_INJECTION_CHECK: 30000,
  PERFORMANCE_METRICS: 120000,
  
  // Categories for easy filtering
  categories: {
    drift: 'DRIFT',
    orbital: 'ORBITAL',
    camera: 'CAMERA',
    performance: 'PERFORMANCE',
    debug: 'DEBUG'
  }
} as const

/**
 * Helper function to get standardized log intervals
 */
export function getLogInterval(category: 'DRIFT_DEBUG' | 'ORBITAL_DRIFT' | 'STAR_CLUSTER_DRIFT' | 'DRIFT_MONITOR_UPDATE' | 'DRIFT_RUNTIME_CHECK' | 'CAMERA_CONTROLLER' | 'DRIFT_INJECTION_CHECK' | 'PERFORMANCE_METRICS'): number {
  return LoggingConfig[category] || 5000 // Default to 5 seconds
}

/**
 * Helper function to create throttled logger with predefined intervals
 */
export function createThrottledLogger(category: string, defaultInterval: number = 5000) {
  return {
    log: (message: string, data?: any) => {
      import('../../../utils/logger').then(({ Logger }) => {
        Logger.throttle(category, message, data, defaultInterval)
      })
    },
    warn: (message: string, data?: any) => {
      import('../../../utils/logger').then(({ Logger }) => {
        Logger.warn(category, message, data)
      })
    },
    error: (message: string, error?: any) => {
      import('../../../utils/logger').then(({ Logger }) => {
        Logger.error(category, message, error)
      })
    }
  }
}

export default LoggingConfig
