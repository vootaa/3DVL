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
  minDistance: 0.001,      // Minimum distance between points in GU
  color: 0x00ffff,         // Trail color (bright cyan)
}

// Trail state
const trailPoints = ref<Vector3[]>([])  // Store galaxy center positions in world coordinates
const trailGeometry = ref<BufferGeometry | null>(null)
const trailMaterial = ref<LineBasicMaterial | null>(null)
const trailOffset = ref<Vector3 | null>(null)

const lastSampleTime = ref(0)
const SAMPLE_THROTTLE = 100

// Galaxy drift data service
const driftDataService = useGalaxyDriftData()

const addTrailPoint = (newPoint: Vector3) => {
  if (trailPoints.value.length > 0) {
    const lastPoint = trailPoints.value[trailPoints.value.length - 1]
    const distance = newPoint.distanceTo(lastPoint)

    if (distance < TRAIL_CONFIG.minDistance) {
      return
    }
  }

  trailPoints.value.push(newPoint.clone())

  if (trailPoints.value.length > TRAIL_CONFIG.maxPoints) {
    trailPoints.value.shift()
  }
}

const initializeTrail = () => {
  trailGeometry.value = new BufferGeometry()
  trailMaterial.value = new LineBasicMaterial({
    color: TRAIL_CONFIG.color,
    transparent: true,
    opacity: 1.0
  })

  const currentCenter = driftDataService.getGalaxyCenter()
  if (currentCenter) {
    trailOffset.value = new Vector3(currentCenter.x, currentCenter.y, currentCenter.z)
    Logger.log('TRAIL_RENDERER', `Trail offset recorded: (${trailOffset.value.x.toFixed(6)}, ${trailOffset.value.y.toFixed(6)}, ${trailOffset.value.z.toFixed(6)})`)

    trailPoints.value = [new Vector3(0, 0, 0)]
  }

  Logger.log('TRAIL_RENDERER', 'Trail renderer initialized with offset correction')
}

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

  if (trailOffset.value) {
    worldPos.sub(trailOffset.value)
  }

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
  if (now - lastSampleTime.value < SAMPLE_THROTTLE) {
    return
  }
  lastSampleTime.value = now

  // Get current position data
  const positionData = driftDataService.getDriftPosition()
  if (!positionData) return

  // Process galaxy center position
  const galaxyPos = processDriftData(positionData)
  if (!galaxyPos) return

  // base on distance filter
  addTrailPoint(galaxyPos)

  // Update geometry
  if (trailPoints.value.length >= 2) {
    updateTrailGeometry()
  }
}

watch(() => props.enabled, (enabled) => {
  if (enabled) {
    Logger.log('TRAIL_RENDERER', 'Trail rendering enabled')
    clearTrail()

    const currentCenter = driftDataService.getGalaxyCenter()
    if (currentCenter) {
      trailOffset.value = new Vector3(currentCenter.x, currentCenter.y, currentCenter.z)
      trailPoints.value = [new Vector3(0, 0, 0)]
      Logger.log('TRAIL_RENDERER', `Trail offset recorded: (${trailOffset.value.x.toFixed(6)}, ${trailOffset.value.y.toFixed(6)}, ${trailOffset.value.z.toFixed(6)})`)
    }
  } else {
    Logger.log('TRAIL_RENDERER', 'Trail rendering disabled')
    clearTrail()
  }
}, { immediate: true })

watch(
  () => driftDataService.getGalaxyCenter(),
  (newCenter) => {
    if (newCenter && props.enabled) {
      const positionData = driftDataService.getDriftPosition()
      if (positionData) {
        samplePosition()
      }
    }
  },
  { immediate: false }
)

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

// Setup and cleanup
onMounted(() => {
  nextTick(() => {
    initializeTrail()
  })
})

onUnmounted(() => {
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
