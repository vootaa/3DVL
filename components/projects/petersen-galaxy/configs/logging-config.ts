/**
 * Unified logging configuration for Petersen Galaxy project
 * Centralizes all log intervals and categories for easy management
 */

export const LoggingConfig = {
  // Main drift system intervals (in milliseconds)
  DRIFT_DEBUG: 15000,           // Main drift debugging - 15 seconds (increased)
  ORBITAL_DRIFT: 45000,         // Orbital system drift application - 45 seconds (increased)
  STAR_CLUSTER_DRIFT: 45000,    // Star cluster drift application - 45 seconds (increased)
  DRIFT_MONITOR_UPDATE: 10000,  // Debug panel updates - 10 seconds (increased)
  
  // System health checks
  DRIFT_RUNTIME_CHECK: 60000,   // Runtime system checks - 60 seconds (increased)
  CAMERA_CONTROLLER: 10000,     // Camera movement logs - 10 seconds (increased)
  
  // Injection validation
  DRIFT_INJECTION_CHECK: 30000, // Dependency injection validation - 30 seconds (increased)
  
  // Performance monitoring
  PERFORMANCE_METRICS: 120000,  // Performance logs - 120 seconds (increased)
  
  // Categories for easy filtering
  CATEGORIES: {
    DRIFT: 'DRIFT',
    ORBITAL: 'ORBITAL', 
    CAMERA: 'CAMERA',
    PERFORMANCE: 'PERFORMANCE',
    DEBUG: 'DEBUG'
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
