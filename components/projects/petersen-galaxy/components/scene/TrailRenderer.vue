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
  maxPoints: 500,
  minDistance: 0.001,
  keepOrigin: true,
  color: 0x00ffff,
}

// Trail state
const trailPoints = ref<Vector3[]>([])  // Store relative positions (offset removed)
const trailGeometry = ref<BufferGeometry | null>(null)
const trailMaterial = ref<LineBasicMaterial | null>(null)
const trailOffset = ref<Vector3 | null>(null)

// Throttling
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

  while (trailPoints.value.length > TRAIL_CONFIG.maxPoints) {
    if (TRAIL_CONFIG.keepOrigin && trailPoints.value.length > 2) {
      const removeIndex = Math.floor(trailPoints.value.length / 2)
      trailPoints.value.splice(removeIndex, 1)
    } else {
      trailPoints.value.shift()
    }
  }
}

const initializeTrail = () => {
  trailGeometry.value = new BufferGeometry()
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

/**
 * Convert raw position data to relative coordinates for trail visualization
 */
const processDriftData = (positionData: { x: string; y: string; z: string }): Vector3 | null => {
  try {
    const x = parseFloat(positionData.x)
    const y = parseFloat(positionData.y)
    const z = parseFloat(positionData.z)

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      Logger.warn('TRAIL_RENDERER', 'Invalid position data received')
      return null
    }

    const worldPos = new Vector3(x / 1000, y / 1000, z / 1000)

    // Remove offset to get relative position
    if (trailOffset.value) {
      worldPos.sub(trailOffset.value)
    }

    return worldPos
  } catch (error) {
    Logger.error('TRAIL_RENDERER', 'Error processing drift data:', error)
    return null
  }
}

/**
 * Calculate actual trail length
 */
const calculateTrailLength = (): number => {
  if (trailPoints.value.length < 2) return 0

  let totalLength = 0
  for (let i = 1; i < trailPoints.value.length; i++) {
    totalLength += trailPoints.value[i].distanceTo(trailPoints.value[i - 1])
  }
  return totalLength
}

/**
 * Update trail geometry with current trail points
 */
const updateTrailGeometry = () => {
  if (!trailGeometry.value || trailPoints.value.length < 2) return

  try {
    const positions = new Float32Array(trailPoints.value.length * 3)
    trailPoints.value.forEach((pos, i) => {
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z
    })

    trailGeometry.value.setAttribute('position', new Float32BufferAttribute(positions, 3))
    trailGeometry.value.attributes.position.needsUpdate = true

    if (trailPoints.value.length % 50 === 0) {
      const actualLength = calculateTrailLength()
      const firstPos = trailPoints.value[0]
      const lastPos = trailPoints.value[trailPoints.value.length - 1]
      const straightDistance = firstPos.distanceTo(lastPos)

      Logger.log('TRAIL_RENDERER',
        `Trail: ${trailPoints.value.length}/${TRAIL_CONFIG.maxPoints} points, ` +
        `path: ${actualLength.toFixed(4)} GU, ` +
        `straight: ${straightDistance.toFixed(4)} GU`
      )
    }
  } catch (error) {
    Logger.error('TRAIL_RENDERER', 'Error updating trail geometry:', error)
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

  const positionData = driftDataService.getDriftPosition()
  if (!positionData) return

  const galaxyPos = processDriftData(positionData)
  if (!galaxyPos) return

  addTrailPoint(galaxyPos)

  if (trailPoints.value.length >= 2) {
    updateTrailGeometry()
  }
}

// Watch enabled state
watch(() => props.enabled, (enabled) => {
  if (enabled) {
    Logger.log('TRAIL_RENDERER', 'Trail rendering enabled')
    clearTrail()

    // Set initial offset when enabling
    const currentCenter = driftDataService.getGalaxyCenter()
    if (currentCenter) {
      trailOffset.value = new Vector3(currentCenter.x, currentCenter.y, currentCenter.z)
      trailPoints.value = [new Vector3(0, 0, 0)]  // Start from origin
      Logger.log('TRAIL_RENDERER', `Trail offset recorded: (${trailOffset.value.x.toFixed(6)}, ${trailOffset.value.y.toFixed(6)}, ${trailOffset.value.z.toFixed(6)})`)
    }
  } else {
    Logger.log('TRAIL_RENDERER', 'Trail rendering disabled')
    clearTrail()
  }
}, { immediate: true })

// Watch galaxy center changes
watch(
  () => driftDataService.getGalaxyCenter(),
  (newCenter) => {
    if (newCenter && props.enabled) {
      samplePosition()
    }
  },
  { immediate: false }
)

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
    hasMaterial: !!trailMaterial.value,
    offsetSet: !!trailOffset.value,
    trailLength: calculateTrailLength()
  })
})
</script>

<template>
  <TresGroup v-if="props.enabled">
    <TresLine v-if="trailGeometry && trailMaterial && trailPoints.length >= 2" :geometry="trailGeometry"
      :material="trailMaterial" :visible="true" />
  </TresGroup>
</template>
