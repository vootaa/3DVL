/**
 * Galaxy Drift Debug Utilities
 * Tools for diagnosing and monitoring galaxy drift system
 */

import { Vector3 } from 'three'
import { Logger } from '../../../utils/logger'
import type { GalaxyDriftState } from '../configs/galaxy-drift-config'
import { LoggingConfig } from '../configs/logging-config'

export class DriftDebugger {
  private static instance: DriftDebugger
  private lastPosition: Vector3 = new Vector3()
  private positionHistory: Vector3[] = []
  private velocityHistory: number[] = []
  private maxHistoryLength = 100

  static getInstance(): DriftDebugger {
    if (!DriftDebugger.instance) {
      DriftDebugger.instance = new DriftDebugger()
    }
    return DriftDebugger.instance
  }

  /**
   * Check if drift is actually occurring by comparing positions
   */
  checkDriftActivity(currentState: GalaxyDriftState): {
    isDrifting: boolean
    velocityMagnitude: number
    positionChange: number
    diagnosis: string
  } {
    const currentPosition = currentState.currentPosition
    const velocity = currentState.velocity
    const velocityMagnitude = velocity.length()
    
    // Calculate position change since last check
    const positionChange = this.lastPosition.distanceTo(currentPosition)
    
    // Update history
    this.positionHistory.push(currentPosition.clone())
    this.velocityHistory.push(velocityMagnitude)
    
    if (this.positionHistory.length > this.maxHistoryLength) {
      this.positionHistory.shift()
      this.velocityHistory.shift()
    }
    
    // Analyze drift activity with much lower thresholds for better detection
    let diagnosis = ''
    let isDrifting = false
    
    if (velocityMagnitude < 0.0000001) { // Much lower threshold
      diagnosis = 'NO_VELOCITY - Drift velocity is essentially zero'
    } else if (positionChange < 0.0000001) { // Much lower threshold
      diagnosis = 'NO_MOVEMENT - Velocity exists but position not changing'
    } else if (velocityMagnitude > 0.0000001 && positionChange > 0.0000001) {
      isDrifting = true
      diagnosis = 'ACTIVE_DRIFT - System is functioning normally'
    } else {
      diagnosis = 'UNKNOWN_STATE - Drift state is unclear'
    }
    
    // Update last position
    this.lastPosition.copy(currentPosition)
    
    return {
      isDrifting,
      velocityMagnitude,
      positionChange,
      diagnosis
    }
  }

  /**
   * Get detailed drift statistics
   */
  getDriftStatistics(currentState: GalaxyDriftState) {
    const avgVelocity = this.velocityHistory.length > 0 
      ? this.velocityHistory.reduce((a, b) => a + b, 0) / this.velocityHistory.length 
      : 0
    
    const maxVelocity = this.velocityHistory.length > 0 
      ? Math.max(...this.velocityHistory) 
      : 0
    
    const totalTravelDistance = currentState.totalDistance
    const driftDuration = currentState.driftTime
    
    return {
      averageVelocity: avgVelocity,
      maxVelocity: maxVelocity,
      totalDistance: totalTravelDistance,
      duration: driftDuration,
      samplesCollected: this.velocityHistory.length,
      currentPosition: {
        x: currentState.currentPosition.x,
        y: currentState.currentPosition.y,
        z: currentState.currentPosition.z
      }
    }
  }

  /**
   * Force log drift status using Logger.throttle for consistency
   */
  forceDriftLog(currentState: GalaxyDriftState) {
    const activity = this.checkDriftActivity(currentState)
    const stats = this.getDriftStatistics(currentState)
    
    // Use Logger.throttle instead of console.log for consistent behavior
    Logger.throttle('DRIFT_DEBUG_COMPREHENSIVE', 'Comprehensive Drift Analysis', {
      timestamp: new Date().toISOString(),
      activity,
      statistics: stats,
      configEnabled: true, // We'll check this externally
      injectionStatus: 'To be checked externally'
    }, LoggingConfig.DRIFT_DEBUG) // Use centralized config
  }

  /**
   * Check if galaxy center injection is working in components
   */
  static validateInjection(
    componentName: string, 
    galaxyCenter: any, 
    objectRef: any
  ) {
    let status = 'UNKNOWN'
    let details = {}
    
    if (!galaxyCenter) {
      status = 'INJECTION_FAILED'
      details = { error: 'galaxyCenter is null or undefined' }
    } else if (!galaxyCenter.value) {
      status = 'CENTER_VALUE_MISSING'
      details = { error: 'galaxyCenter.value is null or undefined' }
    } else if (!objectRef?.value) {
      status = 'OBJECT_REF_MISSING'
      details = { error: 'Object reference for applying drift is missing' }
    } else {
      status = 'INJECTION_SUCCESS'
      details = {
        centerPosition: {
          x: galaxyCenter.value.x.toFixed(6),
          y: galaxyCenter.value.y.toFixed(6),
          z: galaxyCenter.value.z.toFixed(6)
        },
        objectPosition: objectRef.value.position ? {
          x: objectRef.value.position.x.toFixed(6),
          y: objectRef.value.position.y.toFixed(6),
          z: objectRef.value.position.z.toFixed(6)
        } : 'Position not available'
      }
    }
    
    Logger.throttle('DRIFT_INJECTION_CHECK', `${componentName} injection status: ${status}`, details, LoggingConfig.DRIFT_INJECTION_CHECK)
    
    return { status, details }
  }
}

export default DriftDebugger
