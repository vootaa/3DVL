<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, toRef } from 'vue'
import {
  AdditiveBlending,
  ShaderMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
} from 'three'
import { orbitalConfig } from '../../configs/orbital-config'
import { starClusterConfig } from '../../configs/star-cluster-config'
import starVertexShader from '../../shaders/star-vertex.glsl'
import starFragmentShader from '../../shaders/star-fragment.glsl'

interface Props {
  galaxyCenter?: Vector3
  globalTime?: number
  evolutionProgress?: number
  enabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  galaxyCenter: () => new Vector3(0, 0, 0),
  globalTime: 0,
  evolutionProgress: 1,
  enabled: true
})

const galaxyCenter = toRef(props, 'galaxyCenter')

// Use renamed configuration for stellar core
const { innerRadius, middleRadius } = orbitalConfig
const { stars } = starClusterConfig
const stellarCoreColors = starClusterConfig.visual.colors
const stellarCoreSizes = {
  'green-star': { base: 14, amplitude: 0.05 },
  'golden-star': { base: 18, amplitude: 0.10 },
  'blue-star': { base: 28, amplitude: 0.15 }
}
type StellarType = 'green-star' | 'golden-star' | 'blue-star'

// Component refs
const stellarCoreGeometry = ref<BufferGeometry>()
const stellarCoreMaterial = ref<ShaderMaterial>()
const stellarCoreClusterRef = ref()

// State management
let animationId: number | undefined
let isInitialized = false
const initialChaoticPositions = new Float32Array(stars.length * 3)

// Initialize stellar core particles with evolution support
function initStellarCore() {
  const geometry = new BufferGeometry()
  const positions = new Float32Array(stars.length * 3)
  const colors = new Float32Array(stars.length * 3)
  const sizes = new Float32Array(stars.length)
  const alphas = new Float32Array(stars.length)
  const times = new Float32Array(stars.length)
  const pulseOffsets = new Float32Array(stars.length)
  const targetRadii = new Float32Array(stars.length)
  const rotationSpeeds = new Float32Array(stars.length)
  const initialAngles = new Float32Array(stars.length)

  stars.forEach((star, index) => {
    const i3 = index * 3
    
    // Generate initial chaotic positions for evolution animation
    const initialRadius = Math.random() * 6.24
    const initialAngle = Math.random() * Math.PI * 2
    const initialHeight = (Math.random() - 0.5) * 1.5
    
    initialChaoticPositions[i3] = Math.cos(initialAngle) * initialRadius
    initialChaoticPositions[i3 + 1] = initialHeight
    initialChaoticPositions[i3 + 2] = Math.sin(initialAngle) * initialRadius
    
    // Calculate target orbital positions
    const targetAngle = star.theta * Math.PI / 180
    const targetX = star.r * Math.cos(targetAngle)
    const targetY = 0
    const targetZ = star.r * Math.sin(targetAngle)
    
    // Set positions based on evolution progress
    if (props.evolutionProgress >= 1.0) {
      positions[i3] = targetX
      positions[i3 + 1] = targetY
      positions[i3 + 2] = targetZ
    } else {
      // Interpolate between chaotic and target position
      positions[i3] = initialChaoticPositions[i3] + (targetX - initialChaoticPositions[i3]) * props.evolutionProgress
      positions[i3 + 1] = initialChaoticPositions[i3 + 1] + (targetY - initialChaoticPositions[i3 + 1]) * props.evolutionProgress
      positions[i3 + 2] = initialChaoticPositions[i3 + 2] + (targetZ - initialChaoticPositions[i3 + 2]) * props.evolutionProgress
    }
    
    // Store orbital parameters
    targetRadii[index] = star.r
    initialAngles[index] = star.theta * Math.PI / 180
    
    // Set rotation speeds based on orbital radius
    if (star.r === innerRadius) {
      rotationSpeeds[index] = orbitalConfig.rotationSpeeds.inner
    } else if (star.r === middleRadius) {
      rotationSpeeds[index] = orbitalConfig.rotationSpeeds.middle
    } else {
      rotationSpeeds[index] = orbitalConfig.rotationSpeeds.outer
    }
    
    // Set stellar core visual properties
    const color = stellarCoreColors[star.type as StellarType]
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
    
    const sizeConfig = stellarCoreSizes[star.type as StellarType]
    sizes[index] = props.evolutionProgress >= 1.0 
      ? sizeConfig.base 
      : sizeConfig.base * (0.3 + 0.7 * props.evolutionProgress)
    
    alphas[index] = props.evolutionProgress >= 1.0 
      ? 0.85 
      : 0.1 + 0.75 * props.evolutionProgress
    
    times[index] = Math.random() * Math.PI * 2
    pulseOffsets[index] = Math.random() * Math.PI * 2
  })

  // Set up geometry attributes
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('customColor', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1))
  geometry.setAttribute('alpha', new Float32BufferAttribute(alphas, 1))
  geometry.setAttribute('time', new Float32BufferAttribute(times, 1))
  geometry.setAttribute('pulseOffset', new Float32BufferAttribute(pulseOffsets, 1))
  geometry.setAttribute('targetRadius', new Float32BufferAttribute(targetRadii, 1))
  geometry.setAttribute('rotationSpeed', new Float32BufferAttribute(rotationSpeeds, 1))
  geometry.setAttribute('initialAngle', new Float32BufferAttribute(initialAngles, 1))

  // Create stellar core material
  const material = new ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      evolutionTime: { value: 0 },
      resolution: { value: [window.innerWidth, window.innerHeight, 1.0] },
      cameraDistance: { value: 10.0 }
    },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    blending: AdditiveBlending,
    depthTest: false,
    transparent: true
  })

  stellarCoreGeometry.value = geometry
  stellarCoreMaterial.value = material
  isInitialized = true
}

// Animation loop for stellar core
function animate() {
  if (!props.enabled || !stellarCoreMaterial.value || !stellarCoreGeometry.value) {
    animationId = requestAnimationFrame(animate)
    return
  }

  // Update shader uniforms with global time
  stellarCoreMaterial.value.uniforms.time.value = props.globalTime
  stellarCoreMaterial.value.uniforms.evolutionTime.value = props.globalTime * 0.1

  // Update position relative to galaxy center
  if (stellarCoreClusterRef.value && galaxyCenter.value) {
    stellarCoreClusterRef.value.position.set(galaxyCenter.value.x, galaxyCenter.value.y, galaxyCenter.value.z)
  }

  // Update stellar core positions during evolution and orbital motion
  updateStellarCorePositions()
  
  // Update individual star timing
  updateStarTiming()

  animationId = requestAnimationFrame(animate)
}

// Update stellar core positions based on evolution progress and orbital motion
function updateStellarCorePositions() {
  const positions = stellarCoreGeometry.value!.getAttribute('position')
  const targetRadii = stellarCoreGeometry.value!.getAttribute('targetRadius')
  const rotationSpeeds = stellarCoreGeometry.value!.getAttribute('rotationSpeed')
  const initialAngles = stellarCoreGeometry.value!.getAttribute('initialAngle')
  const sizes = stellarCoreGeometry.value!.getAttribute('size')
  const alphas = stellarCoreGeometry.value!.getAttribute('alpha')

  const positionArray = positions.array as Float32Array
  const targetRadiiArray = targetRadii.array as Float32Array
  const rotationSpeedsArray = rotationSpeeds.array as Float32Array
  const initialAnglesArray = initialAngles.array as Float32Array
  const sizesArray = sizes.array as Float32Array
  const alphasArray = alphas.array as Float32Array

  for (let i = 0; i < stars.length; i++) {
    const i3 = i * 3
    const star = stars[i]
    
    // Calculate current orbital position with rotation
    const currentAngle = initialAnglesArray[i] + props.globalTime * rotationSpeedsArray[i]
    const targetRadius = targetRadiiArray[i]
    const targetX = targetRadius * Math.cos(currentAngle)
    const targetZ = targetRadius * Math.sin(currentAngle)
    const targetY = 0

    if (props.evolutionProgress < 1.0) {
      // During evolution: interpolate from chaotic to orbital position
      const startX = initialChaoticPositions[i3]
      const startY = initialChaoticPositions[i3 + 1]
      const startZ = initialChaoticPositions[i3 + 2]
      
      positionArray[i3] = startX + (targetX - startX) * props.evolutionProgress
      positionArray[i3 + 1] = startY + (targetY - startY) * props.evolutionProgress
      positionArray[i3 + 2] = startZ + (targetZ - startZ) * props.evolutionProgress
    } else {
      // Fully evolved: orbital motion
      positionArray[i3] = targetX
      positionArray[i3 + 1] = targetY
      positionArray[i3 + 2] = targetZ
    }

    // Update size and alpha based on evolution progress and pulsing
    const sizeConfig = stellarCoreSizes[star.type as StellarType]
    const baseSize = sizeConfig.base
    const amplitude = sizeConfig.amplitude
    const timeOffset = props.globalTime + i * 0.5
    const amplitudeVariation = 1.0 + amplitude * Math.sin(timeOffset * 2.0)
    
    if (props.evolutionProgress < 1.0) {
      // During evolution: gradual size and alpha increase
      const currentSize = (baseSize * amplitudeVariation * 0.3) +
        (baseSize * amplitudeVariation - baseSize * amplitudeVariation * 0.3) * props.evolutionProgress
      sizesArray[i] = currentSize
      
      const targetAlpha = 0.85
      const currentAlpha = 0.1 + (targetAlpha - 0.1) * props.evolutionProgress
      alphasArray[i] = currentAlpha
    } else {
      // Fully evolved: full size and alpha with pulsing
      sizesArray[i] = baseSize * amplitudeVariation
      alphasArray[i] = 0.85
    }
  }
  
  // Mark attributes for update
  positions.needsUpdate = true
  sizes.needsUpdate = true
  alphas.needsUpdate = true

  emit('sync-state', {
    rotationAngle: props.globalTime * rotationSpeeds.array[0],
    globalTime: props.globalTime
  })
}

// Update individual star timing for animation variety
function updateStarTiming() {
  const times = stellarCoreGeometry.value!.getAttribute('time')
  const timesArray = times.array as Float32Array
  
  for (let i = 0; i < times.count; i++) {
    timesArray[i] += 0.005 + Math.random() * 0.002
  }
  times.needsUpdate = true
}

// Watch for evolution progress changes
watch(() => props.evolutionProgress, () => {
  if (isInitialized) {
    updateStellarCorePositions()
  }
})

// Initialize and start animation on mount
onMounted(() => {
  if (props.evolutionProgress === 1) {
    if (stellarCoreMaterial.value?.uniforms.time) {
      stellarCoreMaterial.value.uniforms.time.value = 30.0
    }
  }
  initStellarCore()
  animate()
})

// Cleanup on unmount
onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

const emit = defineEmits<{
  'sync-state': [{
    rotationAngle: number
    globalTime: number
  }]
}>()

// Reset stellar core to final evolved position (for debugging/testing)
const resetStellarCorePosition = () => {
  if (!isInitialized || !stellarCoreGeometry.value) return
  
  const positions = stellarCoreGeometry.value.getAttribute('position')
  const sizes = stellarCoreGeometry.value.getAttribute('size')
  const alphas = stellarCoreGeometry.value.getAttribute('alpha')
  const targetRadii = stellarCoreGeometry.value.getAttribute('targetRadius')
  const initialAngles = stellarCoreGeometry.value.getAttribute('initialAngle')
  const rotationSpeeds = stellarCoreGeometry.value.getAttribute('rotationSpeed')

  const positionArray = positions.array as Float32Array
  const sizesArray = sizes.array as Float32Array
  const alphasArray = alphas.array as Float32Array
  const targetRadiiArray = targetRadii.array as Float32Array
  const initialAnglesArray = initialAngles.array as Float32Array
  const rotationSpeedsArray = rotationSpeeds.array as Float32Array
  
  for (let i = 0; i < stars.length; i++) {
    const i3 = i * 3
    const star = stars[i]
    const angle = initialAnglesArray[i] + 30.0 * rotationSpeedsArray[i]
    const radius = targetRadiiArray[i]
    
    positionArray[i3] = radius * Math.cos(angle)
    positionArray[i3 + 1] = 0
    positionArray[i3 + 2] = radius * Math.sin(angle)
    
    const sizeConfig = stellarCoreSizes[star.type as StellarType]
    sizesArray[i] = sizeConfig.base
    alphasArray[i] = 0.85
  }
  
  positions.needsUpdate = true
  sizes.needsUpdate = true
  alphas.needsUpdate = true
}

defineExpose({ resetStellarCorePosition })
</script>

<template>
  <TresGroup v-if="enabled" ref="stellarCoreClusterRef">
    <TresPoints
      v-if="stellarCoreGeometry && stellarCoreMaterial"
      ref="stellarCorePoints"
      :geometry="stellarCoreGeometry"
      :material="stellarCoreMaterial"
    />
    <!-- Debug spheres for stellar core positions (hidden by default) -->
    <template v-for="star in stars" :key="`core-${star.id}`">
      <TresMesh
        :position="[
          star.r * Math.cos(star.theta * Math.PI / 180),
          (Math.random() - 0.5) * 0.1,
          star.r * Math.sin(star.theta * Math.PI / 180)
        ]"
        :visible="false"
      >
        <TresSphereGeometry :args="[0.02, 8, 8]" />
        <TresMeshBasicMaterial
          :color="stellarCoreColors[star.type as StellarType]"
          :transparent="true"
          :opacity="0.8"
        />
      </TresMesh>
    </template>
  </TresGroup>
</template>
