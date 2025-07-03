<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, Line, Vector3 } from 'three'
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
  minPositionDelta: 0.0001, // Minimum position change threshold (GU) - lowered for better sensitivity
  samplingInterval: 200,    // Sampling interval in ms - reduced for more frequent sampling
  lineWidth: 2.5,           // Line width (not supported in WebGL)
  alphaMin: 0.3,           // Minimum alpha (oldest points)
  alphaMax: 1.0,           // Maximum alpha (newest points)
  color: 0x00ccff,         // Trail color (cyan)
}

// Trail state
const trailPoints = ref<Vector3[]>([])
const trailGeometry = ref<BufferGeometry | null>(null)
const trailMaterial = ref<LineBasicMaterial | null>(null)
const trailLine = ref<Line | null>(null)
const lastSampleTime = ref(0)
const lastPosition = ref<Vector3 | null>(null)

// Three.js scene reference
const sceneRef = ref()

// Galaxy drift data service
const driftDataService = useGalaxyDriftData()

/**
 * Calculate distance between two Vector3 points
 */
const calculateDistance = (pos1: Vector3, pos2: Vector3): number => {
  return pos1.distanceTo(pos2)
}

/**
 * Add new point to trail buffer with circular buffer logic
 */
const addTrailPoint = (position: Vector3) => {
  // Clone position to avoid reference issues
  const newPoint = position.clone()
  
  // Add to buffer
  trailPoints.value.push(newPoint)
  
  // Implement circular buffer - remove oldest points if over limit
  if (trailPoints.value.length > TRAIL_CONFIG.maxPoints) {
    trailPoints.value.shift()
  }
  
  Logger.throttle('TRAIL_RENDERER', `Added trail point: ${newPoint.x.toFixed(6)}, ${newPoint.y.toFixed(6)}, ${newPoint.z.toFixed(6)}`, {
    totalPoints: trailPoints.value.length,
    bufferUsage: `${trailPoints.value.length}/${TRAIL_CONFIG.maxPoints}`
  }, 1000) // 1秒节流
}

/**
 * Update trail geometry with current points and alpha gradient
 */
const updateTrailGeometry = () => {
  try {
    if (!trailGeometry.value || trailPoints.value.length < 2) return
    
    const points = trailPoints.value
    const positions = new Float32Array(points.length * 3)
    
    // Populate positions
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
    }
    
    // Update geometry attributes safely
    const positionAttr = new Float32BufferAttribute(positions, 3)
    trailGeometry.value.setAttribute('position', positionAttr)
    
    // Mark for update
    const positionAttribute = trailGeometry.value.getAttribute('position')
    if (positionAttribute) {
      positionAttribute.needsUpdate = true
    }
    
    // Calculate opacity based on trail length (more points = more visible)
    if (trailMaterial.value) {
      const fadeRatio = Math.min(points.length / 50, 1.0) // Fade in as points accumulate
      trailMaterial.value.opacity = TRAIL_CONFIG.alphaMin + (TRAIL_CONFIG.alphaMax - TRAIL_CONFIG.alphaMin) * fadeRatio
    }
    
    Logger.throttle('TRAIL_RENDERER', `Updated trail geometry with ${points.length} points`, {
      opacity: trailMaterial.value?.opacity
    }, 1000) // 1秒节流
  } catch (error) {
    Logger.warn('TRAIL_RENDERER', 'Error updating trail geometry', { error })
  }
}

/**
 * Sample current position and update trail if needed
 */
const samplePosition = () => {
  const now = Date.now()
  
  // Check sampling interval
  if (now - lastSampleTime.value < TRAIL_CONFIG.samplingInterval) {
    return
  }
  
  // Get current position from drift data service
  const positionData = driftDataService.getDriftPosition()
  let currentPos: Vector3
  
  if (!positionData) {
    Logger.log('TRAIL_RENDERER', 'No position data available from drift service, generating test data')
    // Generate test spiral trail for debugging
    const time = now / 1000
    const radius = 2 + Math.sin(time * 0.1) * 0.5
    currentPos = new Vector3(
      Math.cos(time * 0.5) * radius,
      Math.sin(time * 0.3) * 0.5,
      Math.sin(time * 0.5) * radius
    )
  } else {
    // Convert string coordinates to numbers
    currentPos = new Vector3(
      parseFloat(positionData.x),
      parseFloat(positionData.y),
      parseFloat(positionData.z)
    )
    
    // Validate the position
    if (isNaN(currentPos.x) || isNaN(currentPos.y) || isNaN(currentPos.z)) {
      Logger.warn('TRAIL_RENDERER', 'Invalid position data', { positionData })
      return
    }
  }
  
  Logger.throttle('TRAIL_RENDERER', `Sampling position: ${currentPos.x.toFixed(6)}, ${currentPos.y.toFixed(6)}, ${currentPos.z.toFixed(6)}`, {}, 2000) // 2 second throttle
  
  // Check if position changed enough to warrant a new sample
  if (lastPosition.value) {
    const delta = calculateDistance(currentPos, lastPosition.value)
    if (delta < TRAIL_CONFIG.minPositionDelta) {
      Logger.throttle('TRAIL_RENDERER', `Position delta ${delta.toFixed(8)} below threshold ${TRAIL_CONFIG.minPositionDelta}`, {}, 3000) // 3 second throttle
      return // Position hasn't changed enough
    }
    Logger.throttle('TRAIL_RENDERER', `Position delta ${delta.toFixed(8)} above threshold, adding point`, {}, 1000) // 1 second throttle
  }
  
  // Add point to trail
  addTrailPoint(currentPos)
  updateTrailGeometry()
  
  // Update state
  lastPosition.value = currentPos
  lastSampleTime.value = now
}

/**
 * Initialize trail rendering components
 */
const initializeTrail = () => {
  try {
    // Create geometry
    trailGeometry.value = new BufferGeometry()
    
    // Create material with transparency (note: linewidth is not supported by WebGL)
    trailMaterial.value = new LineBasicMaterial({
      color: TRAIL_CONFIG.color,
      transparent: true,
      opacity: 0.8,
      // linewidth is not supported in WebGL - use LineSegments or other alternatives if needed
    })
    
    // Create line object
    trailLine.value = new Line(trailGeometry.value, trailMaterial.value)
    
    // Add to scene if available
    if (sceneRef.value) {
      sceneRef.value.add(trailLine.value)
      Logger.log('TRAIL_RENDERER', 'Trail line added to scene')
    }
    
    Logger.log('TRAIL_RENDERER', 'Trail renderer initialized', {
      maxPoints: TRAIL_CONFIG.maxPoints,
      minDelta: TRAIL_CONFIG.minPositionDelta,
      samplingInterval: TRAIL_CONFIG.samplingInterval
    })
  } catch (error) {
    Logger.warn('TRAIL_RENDERER', 'Failed to initialize trail renderer', { error })
  }
}

/**
 * Clear all trail points and reset state
 */
const clearTrail = () => {
  trailPoints.value = []
  lastPosition.value = null
  lastSampleTime.value = 0
  
  if (trailGeometry.value) {
    trailGeometry.value.setAttribute('position', new Float32BufferAttribute([], 3))
    trailGeometry.value.attributes.position.needsUpdate = true
  }
  
  Logger.log('TRAIL_RENDERER', 'Trail cleared')
}

/**
 * Cleanup trail resources
 */
const cleanup = () => {
  if (trailLine.value && sceneRef.value) {
    sceneRef.value.remove(trailLine.value)
  }
  
  if (trailGeometry.value) {
    trailGeometry.value.dispose()
  }
  
  if (trailMaterial.value) {
    trailMaterial.value.dispose()
  }
  
  trailLine.value = null
  trailGeometry.value = null
  trailMaterial.value = null
}

// Sampling interval for trail updates
let samplingTimer: NodeJS.Timeout | null = null

// Watch enabled state
watch(() => props.enabled, (enabled) => {
  try {
    if (enabled) {
      // Start trail sampling
      clearTrail()
      samplingTimer = setInterval(samplePosition, 50) // Sample every 50ms for better responsiveness
      Logger.log('TRAIL_RENDERER', 'Trail rendering enabled')
    } else {
      // Stop trail sampling and clear
      if (samplingTimer) {
        clearInterval(samplingTimer)
        samplingTimer = null
      }
      clearTrail()
      Logger.log('TRAIL_RENDERER', 'Trail rendering disabled')
    }
  } catch (error) {
    Logger.warn('TRAIL_RENDERER', 'Error in enabled state watcher', { error })
  }
}, { immediate: true })

// Setup and cleanup
onMounted(() => {
  nextTick(() => {
    try {
      initializeTrail()
    } catch (error) {
      Logger.warn('TRAIL_RENDERER', 'Failed to initialize trail on mount', { error })
    }
  })
})

onUnmounted(() => {
  try {
    if (samplingTimer) {
      clearInterval(samplingTimer)
      samplingTimer = null
    }
    cleanup()
  } catch (error) {
    Logger.warn('TRAIL_RENDERER', 'Error during cleanup', { error })
  }
})

// Expose methods for debugging
defineExpose({
  clearTrail,
  getTrailStats: () => ({
    pointCount: trailPoints.value.length,
    maxPoints: TRAIL_CONFIG.maxPoints,
    bufferUsage: `${trailPoints.value.length}/${TRAIL_CONFIG.maxPoints}`,
    enabled: props.enabled,
    lastSampleTime: lastSampleTime.value,
    lastPosition: lastPosition.value,
  })
})
</script>

<template>
  <!-- Trail renderer is invisible - it adds objects directly to the scene -->
  <TresGroup ref="sceneRef" v-if="props.enabled">
    <!-- Trail line will be added programmatically -->
  </TresGroup>
</template>
