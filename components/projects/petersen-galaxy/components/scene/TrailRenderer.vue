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

// Import trail particle shaders
import trailVertexShader from '../../shaders/trail-vertex.glsl'
import trailFragmentShader from '../../shaders/trail-fragment.glsl'

// Props
interface Props {
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enabled: false
})

// Particle trail configuration
const TRAIL_CONFIG = {
  maxParticles: 1000,        // Maximum number of particles
  particleLifespan: 10.0,    // Particle lifespan (seconds)
  emissionRate: 50,          // Particles emitted per second
  minDistance: 0.001,        // Minimum sampling distance
  particle: {
    size: 0.5,                // Particle size
    sizeVariation: 0.25,     // Size variation
    speed: 0.001,            // Particle speed
    speedVariation: 0.0005   // Speed variation
  },
  colors: {
    head: [1.0, 0.8, 0.2],   // Head color (bright orange)
    middle: [1.0, 0.4, 0.1], // Middle color (orange-red)
    tail: [0.8, 0.2, 0.0]    // Tail color (dark red)
  }
}

// Particle data structure
interface TrailParticle {
  position: Vector3
  velocity: Vector3
  life: number
  maxLife: number
  size: number
  color: [number, number, number]
  trailProgress: number
}

// Trail state
const trailPoints = ref<Vector3[]>([])
const particles = ref<TrailParticle[]>([])
const trailGeometry = ref<BufferGeometry | null>(null)
const trailMaterial = ref<ShaderMaterial | null>(null)
const trailPointsRef = ref<Points | null>(null)
const trailOffset = ref<Vector3 | null>(null)

// Emission control
const lastEmissionTime = ref(0)
const lastSampleTime = ref(0)
const SAMPLE_THROTTLE = 100

// Galaxy drift data service
const driftDataService = useGalaxyDriftData()

/**
 * Create new particle
 */
const createParticle = (position: Vector3, trailProgress: number): TrailParticle => {
  const velocity = new Vector3(
    (Math.random() - 0.5) * TRAIL_CONFIG.particle.speed,
    (Math.random() - 0.5) * TRAIL_CONFIG.particle.speed,
    (Math.random() - 0.5) * TRAIL_CONFIG.particle.speed
  )

  const life = TRAIL_CONFIG.particleLifespan
  const size = TRAIL_CONFIG.particle.size + 
    (Math.random() - 0.5) * TRAIL_CONFIG.particle.sizeVariation

  // Calculate color based on trail progress
  const { head, middle, tail } = TRAIL_CONFIG.colors
  let color: [number, number, number]
  
  if (trailProgress < 0.5) {
    const t = trailProgress * 2
    color = [
      tail[0] + (middle[0] - tail[0]) * t,
      tail[1] + (middle[1] - tail[1]) * t,
      tail[2] + (middle[2] - tail[2]) * t
    ]
  } else {
    const t = (trailProgress - 0.5) * 2
    color = [
      middle[0] + (head[0] - middle[0]) * t,
      middle[1] + (head[1] - middle[1]) * t,
      middle[2] + (head[2] - middle[2]) * t
    ]
  }

  return {
    position: position.clone(),
    velocity,
    life,
    maxLife: life,
    size,
    color,
    trailProgress
  }
}

/**
 * Update particle system
 */
const updateParticles = (deltaTime: number) => {
  // Update existing particles
  particles.value = particles.value.filter(particle => {
    particle.life -= deltaTime
    particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime))
    
    // Particle decay effect
    const lifeRatio = particle.life / particle.maxLife
    particle.size = TRAIL_CONFIG.particle.size * lifeRatio
    
    return particle.life > 0
  })

  // Emit new particles
  const now = Date.now()
  const emissionInterval = 1000 / TRAIL_CONFIG.emissionRate
  
  if (now - lastEmissionTime.value > emissionInterval && trailPoints.value.length > 0) {
    const latestPoint = trailPoints.value[trailPoints.value.length - 1]
    const trailProgress = 1.0 // Latest point progress is 1.0
    
    // Create multiple particles to increase density
    const particlesPerEmission = 3
    for (let i = 0; i < particlesPerEmission; i++) {
      const particle = createParticle(latestPoint, trailProgress)
      particles.value.push(particle)
    }
    
    lastEmissionTime.value = now
  }

  // Limit particle count
  if (particles.value.length > TRAIL_CONFIG.maxParticles) {
    particles.value.splice(0, particles.value.length - TRAIL_CONFIG.maxParticles)
  }
}

/**
 * Update geometry
 */
const updateGeometry = () => {
  if (!trailGeometry.value || particles.value.length === 0) return

  const particleCount = particles.value.length
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  const lifes = new Float32Array(particleCount)

  particles.value.forEach((particle, i) => {
    positions[i * 3] = particle.position.x
    positions[i * 3 + 1] = particle.position.y
    positions[i * 3 + 2] = particle.position.z

    colors[i * 3] = particle.color[0]
    colors[i * 3 + 1] = particle.color[1]
    colors[i * 3 + 2] = particle.color[2]

    sizes[i] = particle.size
    lifes[i] = particle.life / particle.maxLife
  })

  trailGeometry.value.setAttribute('position', new Float32BufferAttribute(positions, 3))
  trailGeometry.value.setAttribute('color', new Float32BufferAttribute(colors, 3))
  trailGeometry.value.setAttribute('size', new Float32BufferAttribute(sizes, 1))
  trailGeometry.value.setAttribute('life', new Float32BufferAttribute(lifes, 1))

  trailGeometry.value.attributes.position.needsUpdate = true
  trailGeometry.value.attributes.color.needsUpdate = true
  trailGeometry.value.attributes.size.needsUpdate = true
  trailGeometry.value.attributes.life.needsUpdate = true
}

/**
 * Create particle material
 */
const createParticleMaterial = () => {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: TRAIL_CONFIG.particle.size }
    },
    vertexShader: trailVertexShader,
    fragmentShader: trailFragmentShader,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  })
}

const initializeTrail = () => {
  trailGeometry.value = new BufferGeometry()
  trailMaterial.value = createParticleMaterial()

  Logger.log('TRAIL_RENDERER', 'Particle trail system initialized')
}

/**
 * Add trail point
 */
const addTrailPoint = (newPoint: Vector3) => {
  if (trailPoints.value.length > 0) {
    const lastPoint = trailPoints.value[trailPoints.value.length - 1]
    const distance = newPoint.distanceTo(lastPoint)

    if (distance < TRAIL_CONFIG.minDistance) {
      return
    }
  }

  trailPoints.value.push(newPoint.clone())

  // Maintain trail point count
  if (trailPoints.value.length > 100) {
    trailPoints.value.shift()
  }
}

/**
 * Sample position
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
}

/**
 * Process drift data
 */
const processDriftData = (positionData: { x: string; y: string; z: string }): Vector3 | null => {
  try {
    const x = parseFloat(positionData.x)
    const y = parseFloat(positionData.y)
    const z = parseFloat(positionData.z)

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      return null
    }

    const worldPos = new Vector3(x / 1000, y / 1000, z / 1000)

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
 * Clear trail
 */
const clearTrail = () => {
  trailPoints.value = []
  particles.value = []
  lastSampleTime.value = 0
  lastEmissionTime.value = 0

  Logger.log('TRAIL_RENDERER', 'Particle trail cleared')
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

// Render loop
const { onLoop } = useRenderLoop()
onLoop(({ elapsed, delta }) => {
  if (props.enabled) {
    updateParticles(delta)
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
      Logger.log('TRAIL_RENDERER', `Trail offset recorded: (${trailOffset.value.x.toFixed(6)}, ${trailOffset.value.y.toFixed(6)}, ${trailOffset.value.z.toFixed(6)})`)
    }
  } else {
    Logger.log('TRAIL_RENDERER', 'Particle trail rendering disabled')
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
    particleCount: particles.value.length,
    maxParticles: TRAIL_CONFIG.maxParticles,
    enabled: props.enabled
  })
})
</script>

<template>
  <TresGroup v-if="props.enabled">
    <TresPoints
      ref="trailPointsRef"
      v-if="trailGeometry && trailMaterial && particles.length > 0"
      :geometry="trailGeometry"
      :material="trailMaterial"
    />
  </TresGroup>
</template>
