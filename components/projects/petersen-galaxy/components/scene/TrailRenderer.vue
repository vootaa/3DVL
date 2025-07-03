<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, Vector3 } from 'three'
import { useGalaxyDriftData } from '../../services/galaxy-drift-data'
import { Logger } from '../../../../utils/logger'

// Props
interface Props {
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enabled: false
})

// Trail configuration
const TRAIL_CONFIG = {
  maxPoints: 500,           // Maximum points in circular buffer
  samplingInterval: 100,    // Sampling interval in ms
  color: 0x00ffff,         // Trail color (bright cyan)
}

// Trail state
const trailPoints = ref<Vector3[]>([])  // Store galaxy center positions in world coordinates
const trailGeometry = ref<BufferGeometry | null>(null)
const trailMaterial = ref<LineBasicMaterial | null>(null)
const lastSampleTime = ref(0)

// Galaxy drift data service
const driftDataService = useGalaxyDriftData()

/**
 * Convert raw position data to GU units for trail visualization
 * Galaxy center drift represents the actual movement of the galaxy in world space
 */
const processDriftData = (positionData: { x: string; y: string; z: string }): Vector3 | null => {
  // Convert raw data (mGU) to GU by dividing by 1000
  const currentPos = new Vector3(
    parseFloat(positionData.x) / 1000,
    parseFloat(positionData.y) / 1000,
    parseFloat(positionData.z) / 1000
  )
  
  // Return the actual galaxy center position for trail visualization
  // This represents the galaxy's movement in world coordinates
  return currentPos.clone()
}

/**
 * Update trail geometry with current galaxy center positions
 */
const updateTrailGeometry = () => {
  if (!trailGeometry.value || trailPoints.value.length < 2) return
  
  const positions = new Float32Array(trailPoints.value.length * 3)
  
  // Populate positions from galaxy center trail points
  for (let i = 0; i < trailPoints.value.length; i++) {
    const point = trailPoints.value[i]
    positions[i * 3] = point.x
    positions[i * 3 + 1] = point.y
    positions[i * 3 + 2] = point.z
  }
  
  // Update geometry
  trailGeometry.value.setAttribute('position', new Float32BufferAttribute(positions, 3))
  trailGeometry.value.attributes.position.needsUpdate = true
}

/**
 * Sample current galaxy center position and update trail
 */
const samplePosition = () => {
  const now = Date.now()
  
  // Check sampling interval
  if (now - lastSampleTime.value < TRAIL_CONFIG.samplingInterval) {
    return
  }
  
  // Get current position data
  const positionData = driftDataService.getDriftPosition()
  if (!positionData) return
  
  // Process galaxy center position
  const galaxyPos = processDriftData(positionData)
  if (!galaxyPos) return
  
  // Add to trail buffer (circular buffer)
  trailPoints.value.push(galaxyPos)
  if (trailPoints.value.length > TRAIL_CONFIG.maxPoints) {
    trailPoints.value.shift()
  }
  
  // Update geometry
  updateTrailGeometry()
  
  // Update state
  lastSampleTime.value = now
  
  // Simplified logging - only log key state changes
  if (trailPoints.value.length % 50 === 0) {
    Logger.log('TRAIL_RENDERER', `Trail buffer: ${trailPoints.value.length}/${TRAIL_CONFIG.maxPoints} points`)
  }
}

/**
 * Initialize trail rendering
 */
const initializeTrail = () => {
  // Create geometry
  trailGeometry.value = new BufferGeometry()
  
  // Create material
  trailMaterial.value = new LineBasicMaterial({
    color: TRAIL_CONFIG.color,
    transparent: true,
    opacity: 1.0
  })
  
  Logger.log('TRAIL_RENDERER', 'Trail renderer initialized')
}

/**
 * Clear trail data
 */
const clearTrail = () => {
  trailPoints.value = []
  lastSampleTime.value = 0
  
  if (trailGeometry.value) {
    trailGeometry.value.setAttribute('position', new Float32BufferAttribute([], 3))
    trailGeometry.value.attributes.position.needsUpdate = true
  }
  
  Logger.log('TRAIL_RENDERER', 'Trail cleared')
}

/**
 * Cleanup resources
 */
const cleanup = () => {
  if (trailGeometry.value) {
    trailGeometry.value.dispose()
  }
  if (trailMaterial.value) {
    trailMaterial.value.dispose()
  }
  trailGeometry.value = null
  trailMaterial.value = null
}

// Sampling timer
let samplingTimer: NodeJS.Timeout | null = null

// Watch enabled state
watch(() => props.enabled, (enabled) => {
  if (enabled) {
    Logger.log('TRAIL_RENDERER', 'Trail rendering enabled')
    clearTrail()
    samplingTimer = setInterval(samplePosition, TRAIL_CONFIG.samplingInterval)
  } else {
    Logger.log('TRAIL_RENDERER', 'Trail rendering disabled')
    if (samplingTimer) {
      clearInterval(samplingTimer)
      samplingTimer = null
    }
    clearTrail()
  }
}, { immediate: true })

// Setup and cleanup
onMounted(() => {
  nextTick(() => {
    initializeTrail()
  })
})

onUnmounted(() => {
  if (samplingTimer) {
    clearInterval(samplingTimer)
    samplingTimer = null
  }
  cleanup()
})

// Expose methods for debugging
defineExpose({
  clearTrail,
  getTrailStats: () => ({
    pointCount: trailPoints.value.length,
    maxPoints: TRAIL_CONFIG.maxPoints,
    enabled: props.enabled,
    hasGeometry: !!trailGeometry.value,
    hasMaterial: !!trailMaterial.value
  })
})
</script>

<template>
  <!-- Trail renderer - only show line when enabled and has points -->
  <TresGroup v-if="props.enabled">
    <TresLine
      v-if="trailGeometry && trailMaterial && trailPoints.length >= 2"
      :geometry="trailGeometry"
      :material="trailMaterial"
      :visible="true"
    />
  </TresGroup>
</template>
