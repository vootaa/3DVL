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
  samplingInterval: 500,    // Sampling interval in ms
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
  const worldPos = new Vector3(
    parseFloat(positionData.x) / 1000,
    parseFloat(positionData.y) / 1000,
    parseFloat(positionData.z) / 1000
  )

  return worldPos
}

/**
 * Update trail geometry with current galaxy center positions
 */
const updateTrailGeometry = () => {
  if (!trailGeometry.value || trailPoints.value.length < 2) return

  // Get current galaxy center position as reference point
  const galaxyCenter = driftDataService.getGalaxyCenter()
  if (!galaxyCenter) {
    Logger.log('TRAIL_RENDERER', 'Cannot update trail geometry: no galaxy center available')
    return
  }

  const currentCenter = new Vector3(galaxyCenter.x, galaxyCenter.y, galaxyCenter.z)

  const worldPositions: Vector3[] = []

  trailPoints.value.forEach(historicalPos => {
    worldPositions.push(historicalPos.clone())
  })

  if (worldPositions.length > 0) {
    const lastPos = worldPositions[worldPositions.length - 1]
    const currentPos = currentCenter.clone()

    if (lastPos.distanceTo(currentPos) > 0.0001) {
      worldPositions.push(currentPos)
    } else {
      worldPositions[worldPositions.length - 1] = currentPos
    }
  }

  // Check if points are too close together to be visualized
  let significantPoints = 0
  for (let i = 1; i < worldPositions.length; i++) {
    const distance = worldPositions[i].distanceTo(worldPositions[i - 1])
    if (distance > 0.000001) { // Minimum distance threshold
      significantPoints++
    }
  }

  if (significantPoints < 2) {
    Logger.log('TRAIL_RENDERER', `⚠️ WARNING: Only ${significantPoints} significant points (distance > 0.000001), trail may not be visible`)
  }

  // Create positions array for geometry
  const positions = new Float32Array(worldPositions.length * 3)
  worldPositions.forEach((pos, i) => {
    positions[i * 3] = pos.x
    positions[i * 3 + 1] = pos.y
    positions[i * 3 + 2] = pos.z
  })

  // Update geometry
  trailGeometry.value.setAttribute('position', new Float32BufferAttribute(positions, 3))
  trailGeometry.value.attributes.position.needsUpdate = true

  // Log trail update
  if (worldPositions.length % 25 === 0) {
    const firstPos = worldPositions[0]
    const lastPos = worldPositions[worldPositions.length - 1]
    const trailLength = firstPos.distanceTo(lastPos)

    Logger.log('TRAIL_RENDERER', `Trail: ${worldPositions.length} points, from (${firstPos.x.toFixed(3)}, ${firstPos.y.toFixed(3)}, ${firstPos.z.toFixed(3)}) to current center (${lastPos.x.toFixed(3)}, ${lastPos.y.toFixed(3)}, ${lastPos.z.toFixed(3)}), length: ${trailLength.toFixed(6)} GU`)
  }
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

  // Enhanced logging - detailed buffer information every 50 points
  if (trailPoints.value.length % 50 === 0) {
    const bufferSize = trailPoints.value.length
    const firstPoint = trailPoints.value[0]
    const lastPoint = trailPoints.value[bufferSize - 1]

    Logger.log('TRAIL_RENDERER', `Trail buffer: ${bufferSize}/${TRAIL_CONFIG.maxPoints} points`)
    Logger.log('TRAIL_RENDERER', `  First point: (${firstPoint.x.toFixed(6)}, ${firstPoint.y.toFixed(6)}, ${firstPoint.z.toFixed(6)})`)
    Logger.log('TRAIL_RENDERER', `  Last point:  (${lastPoint.x.toFixed(6)}, ${lastPoint.y.toFixed(6)}, ${lastPoint.z.toFixed(6)})`)
    Logger.log('TRAIL_RENDERER', `  Distance span: ${firstPoint.distanceTo(lastPoint).toFixed(6)} units`)

    // Calculate data ranges across all dimensions
    const xValues = trailPoints.value.map(p => p.x)
    const yValues = trailPoints.value.map(p => p.y)
    const zValues = trailPoints.value.map(p => p.z)

    const xRange = { min: Math.min(...xValues), max: Math.max(...xValues) }
    const yRange = { min: Math.min(...yValues), max: Math.max(...yValues) }
    const zRange = { min: Math.min(...zValues), max: Math.max(...zValues) }

    Logger.log('TRAIL_RENDERER', `  X range: ${xRange.min.toFixed(6)} to ${xRange.max.toFixed(6)} (span: ${(xRange.max - xRange.min).toFixed(6)})`)
    Logger.log('TRAIL_RENDERER', `  Y range: ${yRange.min.toFixed(6)} to ${yRange.max.toFixed(6)} (span: ${(yRange.max - yRange.min).toFixed(6)})`)
    Logger.log('TRAIL_RENDERER', `  Z range: ${zRange.min.toFixed(6)} to ${zRange.max.toFixed(6)} (span: ${(zRange.max - zRange.min).toFixed(6)})`)

    // Check data precision - warn if values are too small to be meaningful
    const maxAbsValue = Math.max(
      Math.abs(xRange.min), Math.abs(xRange.max),
      Math.abs(yRange.min), Math.abs(yRange.max),
      Math.abs(zRange.min), Math.abs(zRange.max)
    )

    if (maxAbsValue < 0.000001) {
      Logger.log('TRAIL_RENDERER', `  ⚠️ WARNING: Data precision very low (max: ${maxAbsValue.toFixed(9)}), may not be visible`)
    } else {
      Logger.log('TRAIL_RENDERER', `  ✅ Data precision acceptable (max: ${maxAbsValue.toFixed(6)})`)
    }
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
  }),
  // Advanced trail diagnostics
  diagnoseTrail: () => {
    const galaxyCenter = driftDataService.getGalaxyCenter()
    if (!galaxyCenter) {
      console.log('TRAIL_DIAGNOSIS: No galaxy center available')
      return
    }

    const currentCenter = new Vector3(galaxyCenter.x, galaxyCenter.y, galaxyCenter.z)

    console.log('TRAIL_DIAGNOSIS: Complete Trail Analysis')
    console.log('  Buffer size:', trailPoints.value.length)
    console.log('  Galaxy center:', currentCenter.toArray().map(v => v.toFixed(6)))
    console.log('  Sampling interval:', TRAIL_CONFIG.samplingInterval, 'ms')
    console.log('  Max points:', TRAIL_CONFIG.maxPoints)

    if (trailPoints.value.length > 0) {
      console.log('  First 5 points (relative -> world coordinate conversion):')
      trailPoints.value.slice(0, 5).forEach((relativePos, i) => {
        const worldPos = relativePos.clone().add(currentCenter)
        console.log(`    Point ${i}: rel(${relativePos.x.toFixed(6)}, ${relativePos.y.toFixed(6)}, ${relativePos.z.toFixed(6)}) -> world(${worldPos.x.toFixed(6)}, ${worldPos.y.toFixed(6)}, ${worldPos.z.toFixed(6)})`)
      })

      // Check point distances
      console.log('  Point-to-point distances:')
      const worldPositions = trailPoints.value.map(rel => rel.clone().add(currentCenter))
      for (let i = 1; i < Math.min(5, worldPositions.length); i++) {
        const distance = worldPositions[i].distanceTo(worldPositions[i - 1])
        console.log(`    Point ${i - 1} to ${i}: ${distance.toFixed(6)} units`)
      }
    }

    // Check geometry state
    if (trailGeometry.value) {
      const positions = trailGeometry.value.attributes.position
      console.log('  Geometry state:')
      console.log('    Position attribute:', positions ? `${positions.count} vertices` : 'none')
      console.log('    Needs update:', positions ? positions.needsUpdate : 'N/A')
    }

    // Check material state
    if (trailMaterial.value) {
      console.log('  Material state:')
      console.log('    Color:', trailMaterial.value.color.getHex().toString(16))
      console.log('    Opacity:', trailMaterial.value.opacity)
      console.log('    Visible:', trailMaterial.value.visible)
    }
  }
})
</script>

<template>
  <!-- Trail renderer - only show line when enabled and has points -->
  <TresGroup v-if="props.enabled">
    <TresLine v-if="trailGeometry && trailMaterial && trailPoints.length >= 2" :geometry="trailGeometry"
      :material="trailMaterial" :visible="true" />
  </TresGroup>
</template>
