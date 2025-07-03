/**
 * Logger utility for conditional logging based on development configuration
 */

import { DEV_Config } from './config'

export class Logger {
  private static lastLogTimes: Record<string, number> = {}
  
  /**
   * Safe serialization that avoids circular references
   * @param obj Object to serialize
   * @returns Safe serialized object
   */
  private static safeSerialize(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return obj
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.safeSerialize(item))
    }
    
    // Handle objects - create a safe copy
    const result: any = {}
    const seen = new WeakSet()
    
    try {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key]
          
          // Skip circular references
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              result[key] = '[Circular Reference]'
              continue
            }
            seen.add(value)
          }
          
          // Skip Vue-specific properties that might cause issues
          if (key.startsWith('__') || key === 'dep' || key === 'computed' || key === '_rawValue' || key === '_value') {
            result[key] = `[${typeof value}]`
            continue
          }
          
          result[key] = this.safeSerialize(value)
        }
      }
      return result
    } catch (error) {
      return '[Serialization Error]'
    }
  }

/**
 * Throttled logging - outputs logs for each category at specified intervals
 * @param category Log category
 * @param message Log message
 * @param data Additional data
 * @param interval Throttling interval (milliseconds), uses global config by default
 */
static throttle(category: string, message: string, data?: any, interval = DEV_Config.LOG_INTERVAL): void {
    if (!DEV_Config.LOG_ENABLED) return
    
    const now = Date.now()
    const lastTime = this.lastLogTimes[category] || 0
    
    if (now - lastTime >= interval) {
        if (data !== undefined) {
            const safeData = this.safeSerialize(data)
            console.log(`[${category}] ${message}`, safeData)
        } else {
            console.log(`[${category}] ${message}`)
        }
        this.lastLogTimes[category] = now
    }
}

/**
 * Probability-based logging - outputs logs with a certain probability
 * @param category Log category
 * @param message Log message
 * @param data Additional data
 * @param probability Output probability (0-1)
 */
static random(category: string, message: string, data?: any, probability = 0.05): void {
    if (!DEV_Config.LOG_ENABLED) return
    
    if (Math.random() < probability) {
        if (data !== undefined) {
            console.log(`[${category}] ${message}`, data)
        } else {
            console.log(`[${category}] ${message}`)
        }
    }
}

/**
 * Always output logs - not limited by frequency (still affected by development mode)
 * @param category Log category
 * @param message Log message
 * @param data Additional data
 */
static log(category: string, message: string, data?: any): void {
    if (!DEV_Config.LOG_ENABLED) return
    
    if (data !== undefined) {
        const safeData = this.safeSerialize(data)
        console.log(`[${category}] ${message}`, safeData)
    } else {
        console.log(`[${category}] ${message}`)
    }
}

/**
 * Warning logging - always outputs (affected by development mode)
 * @param category Log category
 * @param message Warning message
 * @param data Additional data
 */
static warn(category: string, message: string, data?: any): void {
    if (!DEV_Config.LOG_ENABLED) return

    if (data !== undefined) {
        const safeData = this.safeSerialize(data)
        console.warn(`[${category}] ${message}`, safeData)
    } else {
        console.warn(`[${category}] ${message}`)
    }
}

/**
 * Error logging - always outputs, typically not affected by development mode
 * @param category Log category
 * @param message Error message
 * @param error Error object
 */
  static error(category: string, message: string, error?: any): void {
    if (error !== undefined) {
      console.error(`[${category}] ${message}`, error)
    } else {
      console.error(`[${category}] ${message}`)
    }
  }
}