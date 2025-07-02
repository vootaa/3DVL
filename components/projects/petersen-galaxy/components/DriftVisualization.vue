<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { Logger } from '../../../utils/logger'

// Drift visualization state - default enabled
const isDriftVisible = ref(true)
const isInitialized = ref(false)

// Inject drift controller from parent
const driftController = inject<any>('driftController')

// Toggle drift visualization
const toggleDriftVisualization = () => {
  if (!canUseDrift.value) {
    Logger.warn('DRIFT_VISUALIZATION', 'Drift controller not available - cannot toggle trails', {
      driftController: !!driftController,
      isInitialized: isInitialized.value
    })
    // Still allow the visual toggle for debugging
    isDriftVisible.value = !isDriftVisible.value
    return
  }
  
  isDriftVisible.value = !isDriftVisible.value
  
  if (driftController) {
    if (isDriftVisible.value) {
      enableDriftVisualization()
    } else {
      disableDriftVisualization()
    }
  }
  
  Logger.log('DRIFT_VISUALIZATION', `Drift visualization ${isDriftVisible.value ? 'enabled' : 'disabled'}`)
  
  // Provide user feedback about what to expect
  if (isDriftVisible.value && canUseDrift.value) {
    setTimeout(() => {
      Logger.log('DRIFT_VISUALIZATION', 'Drift trails enabled! Look for glowing cyan-blue particles that trace the galaxy center movement. It may take a few seconds for the trail to become visible.')
    }, 1000)
  }
}

// Enable drift trail visualization
const enableDriftVisualization = () => {
  if (!driftController) return
  
  try {
    // Enable particle trails
    if (driftController.enableTrails) {
      driftController.enableTrails(true)
    }
    
    // Increase particle visibility
    if (driftController.setTrailIntensity) {
      driftController.setTrailIntensity(0.8)
    }
    
    // Show velocity vectors
    if (driftController.showVelocityVectors) {
      driftController.showVelocityVectors(true)
    }
    
    Logger.log('DRIFT_VISUALIZATION', 'Drift trails and velocity vectors enabled')
  } catch (error) {
    Logger.error('DRIFT_VISUALIZATION', 'Error enabling drift visualization:', error)
  }
}

// Disable drift trail visualization
const disableDriftVisualization = () => {
  if (!driftController) return
  
  try {
    // Disable particle trails
    if (driftController.enableTrails) {
      driftController.enableTrails(false)
    }
    
    // Hide velocity vectors
    if (driftController.showVelocityVectors) {
      driftController.showVelocityVectors(false)
    }
    
    Logger.log('DRIFT_VISUALIZATION', 'Drift trails and velocity vectors disabled')
  } catch (error) {
    Logger.error('DRIFT_VISUALIZATION', 'Error disabling drift visualization:', error)
  }
}


const canUseDrift = computed(() => {
  const hasController = !!(driftController)
  const hasTrailMethods = hasController && 
    typeof driftController.enableTrails === 'function' &&
    typeof driftController.showVelocityVectors === 'function'
  
  Logger.throttle('DRIFT_VISUALIZATION_STATUS', 'Drift capability check', {
    hasController,
    hasTrailMethods,
    driftControllerType: typeof driftController,
    isInitialized: isInitialized.value
  }, 5000) // Log every 5 seconds
  
  return hasController && hasTrailMethods
})

onMounted(() => {
  // Check if drift controller is available
  setTimeout(() => {
    isInitialized.value = true
    if (driftController) {
      Logger.log('DRIFT_VISUALIZATION', 'Drift controller detected and ready')
      // Enable drift trails by default
      if (isDriftVisible.value) {
        enableDriftVisualization()
      }
    } else {
      Logger.warn('DRIFT_VISUALIZATION', 'Drift controller not found')
    }
  }, 1000)
})

onUnmounted(() => {
  // Clean up - disable visualization if active
  if (isDriftVisible.value) {
    disableDriftVisualization()
  }
})
</script>

<template>
  <div 
    class="drift-control" 
    @click="toggleDriftVisualization" 
    :class="{ active: isDriftVisible, disabled: !canUseDrift }"
    :title="canUseDrift ? 'Toggle drift trajectory visualization. When ON, you will see glowing trail particles following the galaxy center movement.' : 'Drift controller not available - check console for details'"
  >
    <div class="control-label">DRIFT TRAILS</div>
    <div class="control-value">
      {{ !canUseDrift ? 'N/A' : (isDriftVisible ? 'ON' : 'OFF') }}
    </div>
    <!-- Status indicator for debugging -->
    <div class="status-indicator" v-if="!canUseDrift">⚠</div>
  </div>
</template>

<style lang="css" scoped>
.drift-control {
  position: relative;
  background: rgba(0, 12, 20, 0.85);
  border: 1px solid rgba(0, 204, 255, 0.4);
  border-radius: 8px;
  padding: 10px 15px;
  color: #00CCFF;
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-weight: 500;
  font-variant-numeric: slashed-zero tabular-nums;
  text-transform: uppercase;
  line-height: 1em;
  transform: skew(-0.5deg, 1.5deg) rotate(1deg);
  transform-origin: center center;
  pointer-events: all;
  cursor: pointer;
  width: 160px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.2s ease;
  z-index: 100;
  box-shadow: 0 0 15px rgba(0, 204, 255, 0.2);
  /* Helmet concave/convex effect */
  background-image: 
    linear-gradient(45deg, rgba(0, 204, 255, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%),
    radial-gradient(circle at 70% 30%, rgba(0, 204, 255, 0.05) 0%, transparent 70%);
}

.drift-control:hover:not(.disabled) {
  background: rgba(0, 20, 30, 0.9);
  border-color: rgba(0, 204, 255, 0.6);
  box-shadow: 0 0 25px rgba(0, 204, 255, 0.4);
  transform: skew(-0.5deg, 1.5deg) rotate(1deg) scale(1.02);
  /* Enhanced helmet effect on hover */
  background-image: 
    linear-gradient(45deg, rgba(0, 204, 255, 0.15) 0%, transparent 50%, rgba(0, 0, 0, 0.3) 100%),
    radial-gradient(circle at 70% 30%, rgba(0, 204, 255, 0.08) 0%, transparent 70%);
}

.drift-control.active {
  background: rgba(0, 30, 40, 0.9);
  border-color: rgba(0, 255, 255, 0.7);
  color: #66DDFF;
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
}

.drift-control.disabled {
  opacity: 0.7;
  cursor: not-allowed;
  border-color: rgba(255, 100, 100, 0.4);
  color: rgba(255, 150, 150, 0.6);
  background: rgba(20, 5, 5, 0.6);
  /* Remove pointer-events: none to allow click debugging */
}

.control-label {
  font-size: 0.9em;
  opacity: 0.8;
}

.control-value {
  font-size: 1.6em;
  line-height: 1em;
  margin: 2px 0;
  text-align: right;
}

.status-indicator {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 12px;
  color: #ff9999;
  opacity: 0.8;
}

@media only screen and (max-width: 900px) {
  .drift-control {
    padding: 8px 12px;
    width: 140px;
    min-height: 50px;
    transform: skew(-0.25deg, 1deg) rotate(0.75deg);
  }

  .control-value {
    font-size: 1.4em;
  }
}
</style>
