<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { 
  AdditiveBlending, 
  ShaderMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
} from 'three'
import { orbitalConfig } from '../configs/orbital-config'
import { starClusterConfig } from '../configs/star-cluster-config'

// Import shaders
import starVertexShader from '../shaders/star-vertex.glsl'
import starFragmentShader from '../shaders/star-fragment.glsl'

// Inject galaxy center position
const galaxyCenter = inject('galaxyCenter', ref(new Vector3(0, 0, 0)))

// Get configuration from imported modules
const { innerRadius, middleRadius} = orbitalConfig
const { stars } = starClusterConfig
const starColors = starClusterConfig.visual.colors
const starSizes = {
  'green-star': { base: 14, amplitude: 0.05 }, // Inner orbit - green stars
  'golden-star': { base: 18, amplitude: 0.10 }, // Middle orbit - golden stars  
  'blue-star': { base: 28, amplitude: 0.15 }   // Outer orbit - blue stars
}

// Type alias for stellar classifications by color
type StellarType = 'green-star' | 'golden-star' | 'blue-star'

// Star shaders - now imported from external files

// References for storing star geometry and material
const starGeometry = ref()
const starMaterial = ref()
const starPoints = ref()
const starClusterRef = ref()

// Animation time and evolution state
let animationTime = 0
let animationId: number
let isInitialized = false
let evolutionComplete = false

// Store initial chaotic positions for reset
const initialChaoticPositions = new Float32Array(stars.length * 3)

// Camera distance tracking
const cameraPosition = inject('cameraPosition', ref(new Vector3(0, 0, 10)))

// Initialize star system with evolution data
const initStars = () => {
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
    // Start from chaotic position (like orbital system)
    const initialRadius = Math.random() * 6.24 // maxSpaceRadius
    const initialAngle = Math.random() * Math.PI * 2
    const initialHeight = (Math.random() - 0.5) * 1.5
    
    const i3 = index * 3
    
    // Initial chaotic position
    positions[i3] = Math.cos(initialAngle) * initialRadius
    positions[i3 + 1] = initialHeight
    positions[i3 + 2] = Math.sin(initialAngle) * initialRadius
    
    // Store initial chaotic positions for state management
    initialChaoticPositions[i3] = positions[i3]
    initialChaoticPositions[i3 + 1] = positions[i3 + 1]
    initialChaoticPositions[i3 + 2] = positions[i3 + 2]
    
    // Target orbital data
    targetRadii[index] = star.r
    initialAngles[index] = star.theta * Math.PI / 180
    
    // Set rotation speed based on orbit
    if (star.r === innerRadius) {
      rotationSpeeds[index] = orbitalConfig.rotationSpeeds.inner
    } else if (star.r === middleRadius) {
      rotationSpeeds[index] = orbitalConfig.rotationSpeeds.middle
    } else {
      rotationSpeeds[index] = orbitalConfig.rotationSpeeds.outer
    }
    
    // Color
    const color = starColors[star.type as StellarType]
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
    
    // Start with small size (will grow during evolution)
    const sizeConfig = starSizes[star.type as StellarType]
    sizes[index] = sizeConfig.base * 0.3 // Start small
    
    // Start dim (will brighten during evolution)
    alphas[index] = 0.1 + Math.random() * 0.1
    
    // Time offset (for twinkling effect - reduced amplitude)
    times[index] = Math.random() * Math.PI * 2
    
    // Pulse offset (reduced amplitude)
    pulseOffsets[index] = Math.random() * Math.PI * 2
  })
  
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('customColor', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1))
  geometry.setAttribute('alpha', new Float32BufferAttribute(alphas, 1))
  geometry.setAttribute('time', new Float32BufferAttribute(times, 1))
  geometry.setAttribute('pulseOffset', new Float32BufferAttribute(pulseOffsets, 1))
  geometry.setAttribute('targetRadius', new Float32BufferAttribute(targetRadii, 1))
  geometry.setAttribute('rotationSpeed', new Float32BufferAttribute(rotationSpeeds, 1))
  geometry.setAttribute('initialAngle', new Float32BufferAttribute(initialAngles, 1))
  
  const material = new ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      evolutionTime: { value: 0 },
      resolution: { value: [window.innerWidth, window.innerHeight, 1.0] },
      cameraDistance: { value: 10.0 } // Add camera distance for size scaling
    },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    blending: AdditiveBlending,
    depthTest: false,
    transparent: true
  })
  
  starGeometry.value = geometry
  starMaterial.value = material
  isInitialized = true
}

// Animation loop with evolution and orbital rotation
const animate = () => {
  animationTime += 0.016 // ~60fps
  
  if (starMaterial.value && starGeometry.value) {
    starMaterial.value.uniforms.time.value = animationTime
    starMaterial.value.uniforms.evolutionTime.value = animationTime * 0.1 // Slower evolution
    
    // Update camera distance for shader scaling
    const cameraDistance = cameraPosition.value.length()
    starMaterial.value.uniforms.cameraDistance.value = cameraDistance
    
    // Apply galaxy center drift to star cluster
    if (starClusterRef.value) {
      const center = galaxyCenter.value
      starClusterRef.value.position.set(center.x, center.y, center.z)
    }
    
    // Update positions to follow orbital rotation
    const positions = starGeometry.value.getAttribute('position')
    const targetRadii = starGeometry.value.getAttribute('targetRadius')
    const rotationSpeeds = starGeometry.value.getAttribute('rotationSpeed')
    const initialAngles = starGeometry.value.getAttribute('initialAngle')
    const sizes = starGeometry.value.getAttribute('size')
    const alphas = starGeometry.value.getAttribute('alpha')
    
    if (positions && targetRadii && rotationSpeeds && initialAngles) {
      for (let i = 0; i < stars.length; i++) {
        const i3 = i * 3
        const star = stars[i]
        
        // Evolution progress (0 to 1 over time) with smooth easing
        const rawProgress = Math.min(1.0, animationTime * 0.04) // 25 seconds to fully evolve
        // Apply easeInOutCubic for smoother evolution
        const evolutionProgress = rawProgress < 0.5 
          ? 4 * rawProgress * rawProgress * rawProgress 
          : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;
        
        if (rawProgress >= 1.0) {
          evolutionComplete = true
        }
        
        // Current orbital angle (rotating with time) - ensure exact orbit positioning
        const currentAngle = initialAngles.array[i] + animationTime * rotationSpeeds.array[i]
        
        // Target position - stars must be exactly on orbit
        const targetRadius = targetRadii.array[i]
        const targetX = targetRadius * Math.cos(currentAngle)
        const targetZ = targetRadius * Math.sin(currentAngle)
        const targetY = 0
        
        // Smooth interpolation from initial chaotic position to exact orbital position
        if (evolutionProgress < 1.0) {
          // During evolution: interpolate from chaos to orbit
          const startX = positions.array[i3]
          const startY = positions.array[i3 + 1] 
          const startZ = positions.array[i3 + 2]
          
          positions.array[i3] = startX + (targetX - startX) * evolutionProgress
          positions.array[i3 + 1] = startY + (targetY - startY) * evolutionProgress
          positions.array[i3 + 2] = startZ + (targetZ - startZ) * evolutionProgress
        } else {
          // After evolution: stay exactly on orbit
          positions.array[i3] = targetX
          positions.array[i3 + 1] = targetY
          positions.array[i3 + 2] = targetZ
        }
        
        // Evolve size with orbital amplitude variation and distance scaling
        const sizeConfig = starSizes[star.type as StellarType]
        const baseSize = sizeConfig.base
        const amplitude = sizeConfig.amplitude
        
        // Apply orbital amplitude variation based on star type
        const timeOffset = animationTime + i * 0.5 // Stagger animations using loop index
        const amplitudeVariation = 1.0 + amplitude * Math.sin(timeOffset * 2.0)
        
        const currentSize = (baseSize * amplitudeVariation * 0.3) + 
                           (baseSize * amplitudeVariation - baseSize * amplitudeVariation * 0.3) * evolutionProgress
        sizes.array[i] = currentSize
        
        // Evolve brightness from dim to bright (stable final brightness)
        const targetAlpha = 0.85 // Fixed brightness for stable appearance
        const currentAlpha = 0.1 + (targetAlpha - 0.1) * evolutionProgress
        alphas.array[i] = currentAlpha
      }
      
      positions.needsUpdate = true
      sizes.needsUpdate = true
      alphas.needsUpdate = true
    }
    
    // Update time attribute for minimal twinkling effect
    const times = starGeometry.value.getAttribute('time')
    if (times) {
      for (let i = 0; i < times.count; i++) {
        times.array[i] += 0.005 + Math.random() * 0.002 // Much reduced twinkling
      }
      times.needsUpdate = true
    }
  }
  
  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  initStars()
  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

// Reset stars to current state without re-evolution
const resetStarsPosition = () => {
  if (!isInitialized || !starGeometry.value) return
  
  const positions = starGeometry.value.getAttribute('position')
  const sizes = starGeometry.value.getAttribute('size')
  const alphas = starGeometry.value.getAttribute('alpha')
  
  if (evolutionComplete) {
    // If evolution is complete, position stars on their current orbital positions
    for (let i = 0; i < stars.length; i++) {
      const i3 = i * 3
      const star = stars[i]
      const targetRadii = starGeometry.value.getAttribute('targetRadius')
      const initialAngles = starGeometry.value.getAttribute('initialAngle')
      const rotationSpeeds = starGeometry.value.getAttribute('rotationSpeed')
      
      const currentAngle = initialAngles.array[i] + animationTime * rotationSpeeds.array[i]
      const targetRadius = targetRadii.array[i]
      
      positions.array[i3] = targetRadius * Math.cos(currentAngle)
      positions.array[i3 + 1] = 0
      positions.array[i3 + 2] = targetRadius * Math.sin(currentAngle)
      
      // Set final evolved sizes and brightness
      const sizeConfig = starSizes[star.type as StellarType]
      sizes.array[i] = sizeConfig.base
      alphas.array[i] = 0.85
    }
  } else {
    // If evolution not complete, use original chaotic positions
    for (let i = 0; i < stars.length; i++) {
      const i3 = i * 3
      positions.array[i3] = initialChaoticPositions[i3]
      positions.array[i3 + 1] = initialChaoticPositions[i3 + 1]
      positions.array[i3 + 2] = initialChaoticPositions[i3 + 2]
    }
  }
  
  positions.needsUpdate = true
  sizes.needsUpdate = true
  alphas.needsUpdate = true
}

// Expose reset function for external control
defineExpose({
  resetStarsPosition
})
</script>

<template>
  <TresGroup ref="starClusterRef">
    <!-- Star point cloud system -->
    <TresPoints 
      v-if="starGeometry && starMaterial"
      ref="starPoints"
      :geometry="starGeometry"
      :material="starMaterial"
    />
    
    <!-- Optional: Add simple star core spheres for close-up observation -->
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
          :color="starColors[star.type as StellarType]"
          :transparent="true"
          :opacity="0.8"
        />
      </TresMesh>
    </template>
  </TresGroup>
</template>
