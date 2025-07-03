/**
 * Galaxy Drift Data Service
 * Provides unified access to galaxy drift state and data
 */

import { ref, computed, type Ref } from 'vue'
import { Vector3 } from 'three'
import { Logger } from '../../../utils/logger'
import { LoggingConfig } from '../configs/logging-config'
import { formatWithUnit } from '../configs/astronomical-units'

// Galaxy drift data interface
interface GalaxyDriftData {
  position: { value: { x: string; y: string; z: string } }
  velocity: { value: string }
  distance: { value: string }
  duration: { value: number }
}

interface GalaxyCenter {
  value: { x: number; y: number; z: number }
}

// Global drift data state
const globalDriftData = ref<GalaxyDriftData | null>(null)
const globalGalaxyCenter = ref<GalaxyCenter | null>(null)
let lastLogTime = 0

/**
 * Galaxy Drift Data Service Class
 */
export class GalaxyDriftDataService {
  private driftData: Ref<GalaxyDriftData | null> = ref(null)
  private galaxyCenter: Ref<GalaxyCenter | null> = ref(null)
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  /**
   * Initialize drift data service
   */
  private initialize() {
    // Try to get data from global state first
    if (globalDriftData.value) {
      this.driftData.value = globalDriftData.value
    }
    if (globalGalaxyCenter.value) {
      this.galaxyCenter.value = globalGalaxyCenter.value
    }

    // Check window state as fallback
    if (typeof window !== 'undefined') {
      const windowDriftState = (window as any).__CURRENT_DRIFT_STATE__
      if (windowDriftState) {
        this.updateFromWindowState(windowDriftState)
      }
    }

    this.isInitialized = true
    this.logStatus()
  }

  /**
   * Update data from window state
   */
  private updateFromWindowState(windowState: any) {
    if (windowState.position) {
      this.driftData.value = {
        position: { value: windowState.position },
        velocity: { value: windowState.velocity || 'N/A' },
        distance: { value: windowState.distance || 'N/A' },
        duration: { value: windowState.duration || 0 }
      }
    }

    if (windowState.center) {
      this.galaxyCenter.value = { value: windowState.center }
    }
  }

  /**
   * Inject drift data from external sources
   */
  public injectData(driftData?: any, galaxyCenter?: any) {
    let dataUpdated = false
    
    if (driftData) {
      this.driftData.value = driftData
      globalDriftData.value = driftData
      dataUpdated = true
    }

    if (galaxyCenter) {
      this.galaxyCenter.value = galaxyCenter
      globalGalaxyCenter.value = galaxyCenter
      dataUpdated = true
    }

    // Also check for reactive computed values
    if (galaxyCenter && typeof galaxyCenter.value === 'object' && galaxyCenter.value instanceof Object) {
      this.galaxyCenter.value = galaxyCenter
      globalGalaxyCenter.value = galaxyCenter
      dataUpdated = true
    }

    if (dataUpdated) {
      this.logStatus()
    }
  }

  /**
   * Get current drift position
   */
  public getDriftPosition(): { x: string; y: string; z: string } | null {
    try {
      // Handle computed values (Vue refs)
      if (this.driftData.value?.position) {
        const pos = this.driftData.value.position
        
        // Check if it's a Vue computed ref with .value
        if (pos && typeof pos === 'object' && 'value' in pos) {
          const innerPos = (pos as any).value
          if (innerPos && typeof innerPos === 'object' && 'x' in innerPos) {
            return innerPos as { x: string; y: string; z: string }
          }
        }
        
        // Check if it's a direct object
        if (pos && typeof pos === 'object' && 'x' in pos) {
          return pos as { x: string; y: string; z: string }
        }
      }
    } catch (error) {
      Logger.warn('GALAXY_DRIFT_SERVICE', 'Error getting drift position:', error)
    }
    
    return null
  }

  /**
   * Get current velocity
   */
  public getVelocity(): string {
    try {
      if (this.driftData.value?.velocity) {
        const vel = this.driftData.value.velocity
        
        // Check if it's a Vue computed ref with .value
        if (vel && typeof vel === 'object' && 'value' in vel) {
          return String((vel as any).value)
        }
        
        // Check if it's a direct value
        return typeof vel === 'string' ? vel : String(vel)
      }
    } catch (error) {
      Logger.warn('GALAXY_DRIFT_SERVICE', 'Error getting velocity:', error)
    }
    
    return 'N/A'
  }

  /**
   * Get current distance
   */
  public getDistance(): string {
    try {
      if (this.driftData.value?.distance) {
        const dist = this.driftData.value.distance
        
        // Check if it's a Vue computed ref with .value
        if (dist && typeof dist === 'object' && 'value' in dist) {
          return String((dist as any).value)
        }
        
        // Check if it's a direct value
        return typeof dist === 'string' ? dist : String(dist)
      }
    } catch (error) {
      Logger.warn('GALAXY_DRIFT_SERVICE', 'Error getting distance:', error)
    }
    
    return 'N/A'
  }

  /**
   * Get galaxy center position
   */
  public getGalaxyCenter(): { x: number; y: number; z: number } | null {
    try {
      if (this.galaxyCenter.value) {
        const center = this.galaxyCenter.value
        
        // Check if it's a Vue computed ref with .value
        if (center && typeof center === 'object' && 'value' in center) {
          const innerCenter = (center as any).value
          if (innerCenter && typeof innerCenter === 'object' && 'x' in innerCenter) {
            return innerCenter as { x: number; y: number; z: number }
          }
        }
        
        // Check if it's a direct object
        if (center && typeof center === 'object' && 'x' in center) {
          return center as { x: number; y: number; z: number }
        }
      }
    } catch (error) {
      Logger.warn('GALAXY_DRIFT_SERVICE', 'Error getting galaxy center:', error)
    }
    
    return null
  }

  /**
   * Get formatted drift status
   */
  public getDriftStatus() {
    const position = this.getDriftPosition()
    const velocity = this.getVelocity()
    const distance = this.getDistance()
    const center = this.getGalaxyCenter()

    return {
      hasData: !!position,
      position,
      velocity,
      distance,
      center,
      formatted: {
        position: position ? `(${position.x}, ${position.y}, ${position.z})` : 'N/A',
        velocity,
        distance,
        center: center ? `(${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})` : 'N/A'
      }
    }
  }

  /**
   * Check if drift data is available
   */
  public hasValidData(): boolean {
    const position = this.getDriftPosition()
    const center = this.getGalaxyCenter()
    return !!(position || center)
  }

  /**
   * Get data availability status
   */
  public getAvailabilityStatus() {
    const hasInjectedData = !!(this.driftData.value && this.galaxyCenter.value)
    const hasWindowState = typeof window !== 'undefined' && !!(window as any).__CURRENT_DRIFT_STATE__
    const hasGlobalData = !!(globalDriftData.value && globalGalaxyCenter.value)

    return {
      hasInjectedData,
      hasWindowState,
      hasGlobalData,
      isAvailable: hasInjectedData || hasWindowState || hasGlobalData,
      isInitialized: this.isInitialized
    }
  }

  /**
   * Log current status with throttling
   */
  private logStatus() {
    const now = Date.now()
    if (now - lastLogTime < LoggingConfig.DRIFT_MONITOR_UPDATE) {
      return
    }

    const status = this.getDriftStatus()
    const availability = this.getAvailabilityStatus()

    Logger.log('GALAXY_DRIFT_SERVICE', 'Status update', {
      hasData: status.hasData,
      position: status.formatted.position,
      velocity: status.velocity,
      distance: status.distance,
      center: status.formatted.center,
      availability,
      rawData: {
        driftData: !!this.driftData.value,
        galaxyCenter: !!this.galaxyCenter.value,
        driftDataKeys: this.driftData.value ? Object.keys(this.driftData.value) : [],
        galaxyCenterKeys: this.galaxyCenter.value ? Object.keys(this.galaxyCenter.value) : [],
        driftDataStructure: this.driftData.value ? JSON.stringify(this.driftData.value, null, 2) : 'null',
        galaxyCenterStructure: this.galaxyCenter.value ? JSON.stringify(this.galaxyCenter.value, null, 2) : 'null'
      }
    })

    lastLogTime = now
  }

  /**
   * Force status update (for debugging)
   */
  public forceStatusUpdate() {
    lastLogTime = 0
    this.logStatus()
  }
}

// Global service instance
let globalServiceInstance: GalaxyDriftDataService | null = null

/**
 * Get or create global drift data service instance
 */
export function useGalaxyDriftData(): GalaxyDriftDataService {
  if (!globalServiceInstance) {
    globalServiceInstance = new GalaxyDriftDataService()
  }
  return globalServiceInstance
}

/**
 * Create a new drift data service instance
 */
export function createGalaxyDriftDataService(): GalaxyDriftDataService {
  return new GalaxyDriftDataService()
}

export default GalaxyDriftDataService
