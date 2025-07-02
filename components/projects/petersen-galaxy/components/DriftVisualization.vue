<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { Logger } from '../../../utils/logger'

// Drift visualization state
const isDriftVisible = ref(false)
const isInitialized = ref(false)

// Inject drift controller from parent
const driftController = inject<Ref<any>>('driftController')

// Toggle drift visualization
const toggleDriftVisualization = () => {
  if (!canUseDrift.value) return // Don't toggle if disabled
  
  isDriftVisible.value = !isDriftVisible.value
  
  if (driftController?.value) {
    if (isDriftVisible.value) {
      enableDriftVisualization()
    } else {
      disableDriftVisualization()
    }
  }
  
  Logger.log('DRIFT_VISUALIZATION', `Drift visualization ${isDriftVisible.value ? 'enabled' : 'disabled'}`)
}

// Enable drift trail visualization
const enableDriftVisualization = () => {
  if (!driftController?.value) return
  
  try {
    // Enable particle trails
    if (driftController.value.enableTrails) {
      driftController.value.enableTrails(true)
    }
    
    // Increase particle visibility
    if (driftController.value.setTrailIntensity) {
      driftController.value.setTrailIntensity(0.8)
    }
    
    // Show velocity vectors
    if (driftController.value.showVelocityVectors) {
      driftController.value.showVelocityVectors(true)
    }
    
    Logger.log('DRIFT_VISUALIZATION', 'Drift trails and velocity vectors enabled')
  } catch (error) {
    Logger.error('DRIFT_VISUALIZATION', 'Error enabling drift visualization:', error)
  }
}

// Disable drift trail visualization
const disableDriftVisualization = () => {
  if (!driftController?.value) return
  
  try {
    // Disable particle trails
    if (driftController.value.enableTrails) {
      driftController.value.enableTrails(false)
    }
    
    // Hide velocity vectors
    if (driftController.value.showVelocityVectors) {
      driftController.value.showVelocityVectors(false)
    }
    
    Logger.log('DRIFT_VISUALIZATION', 'Drift trails and velocity vectors disabled')
  } catch (error) {
    Logger.error('DRIFT_VISUALIZATION', 'Error disabling drift visualization:', error)
  }
}

// Computed status
const driftStatus = computed(() => {
  if (!driftController?.value) return 'Not Available'
  return isDriftVisible.value ? 'Active' : 'Inactive'
})

const canUseDrift = computed(() => {
  return !!(driftController?.value)
})

onMounted(() => {
  // Check if drift controller is available
  setTimeout(() => {
    isInitialized.value = true
    if (driftController?.value) {
      Logger.log('DRIFT_VISUALIZATION', 'Drift controller detected and ready')
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
  <div class="drift-control" @click="toggleDriftVisualization" :class="{ active: isDriftVisible, disabled: !canUseDrift }">
    <div class="control-label">DRIFT TRAILS</div>
    <div class="control-value">{{ isDriftVisible ? 'ON' : 'OFF' }}</div>
  </div>
</template>

<style lang="css" scoped>
.drift-control {
  background: rgba(0, 12, 20, 0.85);
  border: 1px solid rgba(100, 200, 100, 0.4); /* Green color for drift */
  border-radius: 8px;
  padding: 10px 15px;
  color: #66CC66;
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
  box-shadow: 0 0 15px rgba(100, 200, 100, 0.2);
  /* Helmet concave/convex effect - same style as other controls but with green */
  background-image: 
    linear-gradient(45deg, rgba(100, 200, 100, 0.1) 0%, transparent 50%, rgba(0, 0, 0, 0.2) 100%),
    radial-gradient(circle at 70% 30%, rgba(100, 200, 100, 0.05) 0%, transparent 70%);
}

.drift-control:hover:not(.disabled) {
  background: rgba(0, 20, 10, 0.9);
  border-color: rgba(100, 200, 100, 0.6);
  box-shadow: 0 0 25px rgba(100, 200, 100, 0.4);
  transform: skew(-0.5deg, 1.5deg) rotate(1deg) scale(1.02);
  /* Enhanced helmet effect on hover */
  background-image: 
    linear-gradient(45deg, rgba(100, 200, 100, 0.15) 0%, transparent 50%, rgba(0, 0, 0, 0.3) 100%),
    radial-gradient(circle at 70% 30%, rgba(100, 200, 100, 0.08) 0%, transparent 70%);
}

.drift-control.active {
  background: rgba(0, 30, 15, 0.9);
  border-color: rgba(100, 255, 100, 0.7);
  color: #88FF88;
  box-shadow: 0 0 30px rgba(100, 255, 100, 0.5);
}

.drift-control.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #666;
  color: #666;
  background: rgba(20, 20, 20, 0.8);
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
