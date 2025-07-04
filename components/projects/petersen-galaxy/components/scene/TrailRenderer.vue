<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { 
  Float32BufferAttribute, 
  ShaderMaterial, 
  Vector3, 
  AdditiveBlending,
  BufferGeometry,
  Points
} from 'three'
import { useGalaxyDriftData } from '../../services/galaxy-drift-data'
import { useRenderLoop } from '@tresjs/core'
import { Logger } from '../../../../utils/logger'

import trailVertexShader from '../../shaders/trail-vertex.glsl'
import trailFragmentShader from '../../shaders/trail-fragment.glsl'

interface Props {
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enabled: false
})

const TRAIL_CONFIG = {
  maxParticles: 1000,
  minDistance: 0.001,
  particle: {
    sizeHead: 0.08,
    sizeTail: 0.12,
    baseSize: 0.1
  },
  trail: {
    maxTrailPoints: 500,
    keepOrigin: true,
  },
  colors: {
    head: [1.0, 0.4, 0.0],   // Bright orange-red (flame head)
    tail: [1.0, 0.85, 0.3]   // Yellowish (flame tail)
  }
}

const trailPoints = ref<Vector3[]>([])
const trailGeometry = ref<BufferGeometry | null>(null)
const trailMaterial = ref<ShaderMaterial | null>(null)
const trailPointsRef = ref<Points | null>(null)
const trailOffset = ref<Vector3 | null>(null)
const lastSampleTime = ref(0)
const SAMPLE_THROTTLE = 100

const driftDataService = useGalaxyDriftData()

/**
 * Update geometry: distribute particles evenly along the trail
 */
const updateGeometry = () => {
  if (!trailGeometry.value || trailPoints.value.length < 2) return

  const particleCount = TRAIL_CONFIG.maxParticles
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  const progressArr = new Float32Array(particleCount)

  for (let i = 0; i < particleCount; i++) {
    const t = i / (particleCount - 1)
    const floatIdx = t * (trailPoints.value.length - 1)
    const idx = Math.floor(floatIdx)
    const frac = floatIdx - idx

    let pos: Vector3
    if (idx < trailPoints.value.length - 1) {
      pos = trailPoints.value[idx].clone().lerp(trailPoints.value[idx + 1], frac)
    } else {
      pos = trailPoints.value[trailPoints.value.length - 1].clone()
    }

    positions[i * 3] = pos.x
    positions[i * 3 + 1] = pos.y
    positions[i * 3 + 2] = pos.z

    // Color and size gradient
    const color = [
      TRAIL_CONFIG.colors.tail[0] + (TRAIL_CONFIG.colors.head[0] - TRAIL_CONFIG.colors.tail[0]) * t,
      TRAIL_CONFIG.colors.tail[1] + (TRAIL_CONFIG.colors.head[1] - TRAIL_CONFIG.colors.tail[1]) * t,
      TRAIL_CONFIG.colors.tail[2] + (TRAIL_CONFIG.colors.head[2] - TRAIL_CONFIG.colors.tail[2]) * t,
    ]
    colors[i * 3] = color[0]
    colors[i * 3 + 1] = color[1]
    colors[i * 3 + 2] = color[2]

    sizes[i] = TRAIL_CONFIG.particle.sizeTail + (TRAIL_CONFIG.particle.sizeHead - TRAIL_CONFIG.particle.sizeTail) * t
    progressArr[i] = t
  }

  trailGeometry.value.setAttribute('position', new Float32BufferAttribute(positions, 3))
  trailGeometry.value.setAttribute('color', new Float32BufferAttribute(colors, 3))
  trailGeometry.value.setAttribute('size', new Float32BufferAttribute(sizes, 1))
  trailGeometry.value.setAttribute('trailProgress', new Float32BufferAttribute(progressArr, 1))

  trailGeometry.value.attributes.position.needsUpdate = true
  trailGeometry.value.attributes.color.needsUpdate = true
  trailGeometry.value.attributes.size.needsUpdate = true
  trailGeometry.value.attributes.trailProgress.needsUpdate = true
}

/**
 * Create particle material with enhanced shaders
 */
const createParticleMaterial = () => {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: TRAIL_CONFIG.particle.baseSize }
    },
    vertexShader: trailVertexShader,
    fragmentShader: trailFragmentShader,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  })
}

/**
 * Initialize trail system
 */
const initializeTrail = () => {
  trailGeometry.value = new BufferGeometry()
  trailMaterial.value = createParticleMaterial()
  Logger.log('TRAIL_RENDERER', 'Particle trail system initialized')
}

/**
 * Add trail point with smart buffer management
 */
const addTrailPoint = (newPoint: Vector3) => {
  if (trailPoints.value.length > 0) {
    const lastPoint = trailPoints.value[trailPoints.value.length - 1]
    const distance = newPoint.distanceTo(lastPoint)
    if (distance < TRAIL_CONFIG.minDistance) return
  }
  trailPoints.value.push(newPoint.clone())
  while (trailPoints.value.length > TRAIL_CONFIG.trail.maxTrailPoints) {
    if (TRAIL_CONFIG.trail.keepOrigin && trailPoints.value.length > 2) {
      // Remove a random point except the first (origin) and last (head)
      const removeIndex = Math.floor(Math.random() * (trailPoints.value.length - 2)) + 1
      trailPoints.value.splice(removeIndex, 1)
    } else {
      trailPoints.value.shift()
    }
  }
}

/**
 * Sample current position
 */
const samplePosition = () => {
  const now = Date.now()
  if (now - lastSampleTime.value < SAMPLE_THROTTLE) return
  lastSampleTime.value = now
  const positionData = driftDataService.getDriftPosition()
  if (!positionData) return
  const galaxyPos = processDriftData(positionData)
  if (!galaxyPos) return
  addTrailPoint(galaxyPos)
}

/**
 * Process drift data to relative coordinates
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
    if (trailOffset.value) worldPos.sub(trailOffset.value)
    return worldPos
  } catch (error) {
    Logger.error('TRAIL_RENDERER', 'Error processing drift data:', error)
    return null
  }
}

/**
 * Clear trail and reset state
 */
const clearTrail = () => {
  trailPoints.value = []
  lastSampleTime.value = 0
  if (trailGeometry.value) {
    trailGeometry.value.setAttribute('position', new Float32BufferAttribute([], 3))
    trailGeometry.value.setAttribute('color', new Float32BufferAttribute([], 3))
    trailGeometry.value.setAttribute('size', new Float32BufferAttribute([], 1))
    trailGeometry.value.setAttribute('trailProgress', new Float32BufferAttribute([], 1))
  }
  Logger.log('TRAIL_RENDERER', 'Particle trail cleared')
}

/**
 * Cleanup resources
 */
const cleanup = () => {
  if (trailGeometry.value) trailGeometry.value.dispose()
  if (trailMaterial.value) trailMaterial.value.dispose()
  trailGeometry.value = null
  trailMaterial.value = null
}

// Render loop
const { onLoop } = useRenderLoop()
onLoop(({ elapsed }) => {
  if (props.enabled) {
    samplePosition()
    updateGeometry()
    if (trailMaterial.value) {
      trailMaterial.value.uniforms.uTime.value = elapsed
    }
  }
})

// Watch enabled state
watch(() => props.enabled, (enabled) => {
  if (enabled) {
    Logger.log('TRAIL_RENDERER', 'Particle trail rendering enabled')
    clearTrail()
    const currentCenter = driftDataService.getGalaxyCenter()
    if (currentCenter) {
      trailOffset.value = new Vector3(currentCenter.x, currentCenter.y, currentCenter.z)
      if (TRAIL_CONFIG.trail.keepOrigin) {
        trailPoints.value = [new Vector3(0, 0, 0)]
      }
      Logger.log('TRAIL_RENDERER', `Trail offset recorded: (${trailOffset.value.x.toFixed(6)}, ${trailOffset.value.y.toFixed(6)}, ${trailOffset.value.z.toFixed(6)})`)
    }
  } else {
    Logger.log('TRAIL_RENDERER', 'Particle trail rendering disabled')
    clearTrail()
  }
}, { immediate: true })

onMounted(() => {
  nextTick(() => {
    initializeTrail()
  })
})

onUnmounted(() => {
  cleanup()
})

defineExpose({
  clearTrail,
  getTrailStats: () => ({
    pointCount: trailPoints.value.length,
    maxParticles: TRAIL_CONFIG.maxParticles,
    maxTrailPoints: TRAIL_CONFIG.trail.maxTrailPoints,
    enabled: props.enabled,
    hasGeometry: !!trailGeometry.value,
    hasMaterial: !!trailMaterial.value,
    offsetSet: !!trailOffset.value
  })
})
</script>

<template>
  <TresGroup v-if="props.enabled">
    <TresPoints
      ref="trailPointsRef"
      v-if="trailGeometry && trailMaterial"
      :geometry="trailGeometry"
      :material="trailMaterial"
    />
  </TresGroup>
</template>
