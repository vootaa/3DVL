<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { Float32BufferAttribute, MeshBasicMaterial, Vector3, TubeGeometry, CatmullRomCurve3 } from 'three'
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
  tube: {
    radius: 0.005,        // Tube radius
    tubularSegments: 200, // Tubular segments
    radialSegments: 8,    // Radial segments
    closed: false         // Not closed
  },
  colors: {
    head: '#00ffff',      // Head color (newest position)
    tail: '#004466',      // Tail color (historical position)
    glow: '#0088aa'       // Glow color
  }
}

// Trail state
const trailPoints = ref<Vector3[]>([])  // Store relative positions (offset removed)
const trailGeometry = ref<TubeGeometry | null>(null)
const trailMaterial = ref<MeshBasicMaterial | null>(null)
const trailOffset = ref<Vector3 | null>(null)

// Throttling
const lastSampleTime = ref(0)
const SAMPLE_THROTTLE = 100

// Galaxy drift data service
const driftDataService = useGalaxyDriftData()

// Dynamic color calculation
const trailColor = computed(() => {
  const pointCount = trailPoints.value.length
  if (pointCount < 10) {
    return TRAIL_CONFIG.colors.head
  } else if (pointCount < 50) {
    return TRAIL_CONFIG.colors.glow
  } else {
    return TRAIL_CONFIG.colors.tail
  }
})

// Dynamic scaling
const trailScale = computed((): [number, number, number] => {
  const length = calculateTrailLength()
  const baseScale = 1.0
  const dynamicScale = Math.min(2.0, 1.0 + length * 0.1)
  return [baseScale, baseScale, dynamicScale]
})

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

/**
 * Create tube trail geometry
 */
const createTubeTrail = () => {
  if (trailPoints.value.length < 2) return

  try {
    // Create smooth curve
    const curve = new CatmullRomCurve3(trailPoints.value)
    
    // Create tube geometry
    const geometry = new TubeGeometry(
      curve,
      TRAIL_CONFIG.tube.tubularSegments,
      TRAIL_CONFIG.tube.radius,
      TRAIL_CONFIG.tube.radialSegments,
      TRAIL_CONFIG.tube.closed
    )

    // Add color attributes for gradient effect
    const colors = new Float32Array(geometry.attributes.position.count * 3)
    const positionCount = geometry.attributes.position.count
    
    for (let i = 0; i < positionCount; i++) {
      const progress = (i / positionCount) // Progress from 0 to 1
      
      // Gradient from tail (blue) to head (cyan)
      const r = progress * 0.0 + (1 - progress) * 0.0  // Red component
      const g = progress * 1.0 + (1 - progress) * 0.4  // Green component
      const b = progress * 1.0 + (1 - progress) * 0.6  // Blue component
      
      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b
    }
    
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
    
    trailGeometry.value = geometry
    
    Logger.log('TRAIL_RENDERER', `Tube trail created with ${trailPoints.value.length} points`)
  } catch (error) {
    Logger.error('TRAIL_RENDERER', 'Error creating tube trail:', error)
  }
}

const initializeTrail = () => {
  trailMaterial.value = new MeshBasicMaterial({
    color: TRAIL_CONFIG.colors.head,
    transparent: true,
    opacity: 0.8,
    vertexColors: true,  // Enable vertex colors
    // wireframe: true    // Optional: show wireframe
  })

  Logger.log('TRAIL_RENDERER', 'Enhanced trail renderer initialized')
}

/**
 * Clear trail data
 */
const clearTrail = () => {
  trailPoints.value = []
  lastSampleTime.value = 0

  if (trailGeometry.value) {
    trailGeometry.value.dispose()
    trailGeometry.value = null
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
  if (trailPoints.value.length < 2) return

  try {
    // Recreate tube geometry
    createTubeTrail()

    // Periodic log output
    if (trailPoints.value.length % 25 === 0) {
      const actualLength = calculateTrailLength()
      const firstPos = trailPoints.value[0]
      const lastPos = trailPoints.value[trailPoints.value.length - 1]
      const straightDistance = firstPos.distanceTo(lastPos)

      Logger.log('TRAIL_RENDERER',
        `Enhanced trail: ${trailPoints.value.length}/${TRAIL_CONFIG.maxPoints} points, ` +
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
    Logger.log('TRAIL_RENDERER', 'Enhanced trail rendering enabled')
    clearTrail()

    // Set initial offset when enabling
    const currentCenter = driftDataService.getGalaxyCenter()
    if (currentCenter) {
      trailOffset.value = new Vector3(currentCenter.x, currentCenter.y, currentCenter.z)
      trailPoints.value = [new Vector3(0, 0, 0)]  // Start from origin
      Logger.log('TRAIL_RENDERER', `Trail offset recorded: (${trailOffset.value.x.toFixed(6)}, ${trailOffset.value.y.toFixed(6)}, ${trailOffset.value.z.toFixed(6)})`)
    }
  } else {
    Logger.log('TRAIL_RENDERER', 'Enhanced trail rendering disabled')
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
    <!-- Use TresMesh instead of TresLine, similar to space game orbits -->
    <TresMesh 
      v-if="trailGeometry && trailMaterial && trailPoints.length >= 2" 
      :geometry="trailGeometry"
      :scale="trailScale"
    >
      <TresMeshBasicMaterial 
        :color="trailColor" 
        :transparent="true"
        :opacity="0.8"
        :vertex-colors="true"
      />
    </TresMesh>
  </TresGroup>
</template>
