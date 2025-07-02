import { ref, computed, reactive, watch } from "vue"
import { Logger } from '../../../utils/logger'

// Global drift state manager
const globalDriftState = reactive({
  isAvailable: false,
  trailsEnabled: false,
  position: { x: 0, y: 0, z: 0 },
  velocity: 0,
  distance: 0,
  duration: 0,
  initialized: false
})

// Initialize from window state
const initializeFromWindow = () => {
  if (typeof window !== 'undefined') {
    const currentState = (window as any).__CURRENT_DRIFT_STATE__
    if (currentState) {
      globalDriftState.isAvailable = true
      globalDriftState.position = {
        x: currentState.position?.x || 0,
        y: currentState.position?.y || 0,
        z: currentState.position?.z || 0
      }
      globalDriftState.velocity = currentState.velocity || 0
      globalDriftState.distance = currentState.totalDistance || 0
      globalDriftState.duration = currentState.driftTime || 0
      globalDriftState.initialized = true
      
      Logger.log('DRIFT_STATE', 'Initialized from window state', globalDriftState)
      return true
    }
  }
  return false
}

// Composable function
export const useDriftState = () => {
  // Try to initialize if not already done
  if (!globalDriftState.initialized) {
    const initialized = initializeFromWindow()
    if (!initialized) {
      // Force check after a brief delay
      setTimeout(() => {
        if (!globalDriftState.initialized) {
          initializeFromWindow()
        }
      }, 1000)
    }
  }

  let lastStatus: string | null = null
  
  const canUseDrift = computed(() => {
    const hasWindowState = typeof window !== 'undefined' && !!(window as any).__CURRENT_DRIFT_STATE__
    const isAvailable = globalDriftState.isAvailable || hasWindowState
    
    // 只在状态改变时记录日志
    const currentStatus = { isAvailable, hasWindowState, globalInitialized: globalDriftState.initialized, globalAvailable: globalDriftState.isAvailable }
    const statusString = JSON.stringify(currentStatus)
    
    if (!lastStatus || lastStatus !== statusString) {
      Logger.log('DRIFT_STATE', 'Availability changed', currentStatus)
      lastStatus = statusString
    }
    
    return isAvailable
  })

  const toggleTrails = () => {
    globalDriftState.trailsEnabled = !globalDriftState.trailsEnabled
    Logger.log('DRIFT_STATE', `Trails ${globalDriftState.trailsEnabled ? 'enabled' : 'disabled'}`)
    return globalDriftState.trailsEnabled
  }

  const updatePosition = (x: number, y: number, z: number) => {
    globalDriftState.position = { x, y, z }
  }

  const updateVelocity = (velocity: number) => {
    globalDriftState.velocity = velocity
  }

  // Watch for window state changes
  let intervalId: NodeJS.Timeout | null = null
  let wasAvailable = false
  
  if (typeof window !== 'undefined') {
    const checkWindowState = () => {
      const currentState = (window as any).__CURRENT_DRIFT_STATE__
      if (currentState && currentState.position) {
        updatePosition(
          currentState.position.x,
          currentState.position.y,
          currentState.position.z
        )
        updateVelocity(currentState.velocity || 0)
        
        if (!globalDriftState.isAvailable && !wasAvailable) {
          globalDriftState.isAvailable = true
          wasAvailable = true
          Logger.log('DRIFT_STATE', 'Drift became available')
        }
      }
    }

    // Check immediately and then periodically
    checkWindowState()
    intervalId = setInterval(checkWindowState, 500) // Check every 500ms for faster updates
  }

  return {
    // State
    driftState: globalDriftState,
    canUseDrift,
    
    // Actions
    toggleTrails,
    updatePosition,
    updateVelocity,
    
    // Utilities
    initializeFromWindow,
    
    // Cleanup
    cleanup: () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }
  }
}
