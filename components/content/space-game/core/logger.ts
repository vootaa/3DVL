/**
 * Logger utility for conditional logging based on development configuration
 */

import { DEV_Config } from './constants'

export class Logger {
  private static lastLogTimes: Record<string, number> = {}
  
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
            console.log(`[${category}] ${message}`, data)
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
        console.log(`[${category}] ${message}`, data)
    } else {
        console.log(`[${category}] ${message}`)
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