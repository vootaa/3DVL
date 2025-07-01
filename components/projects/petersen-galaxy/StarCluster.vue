<script setup lang="ts">
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { 
  Color,
  AdditiveBlending, 
  ShaderMaterial,
  BufferGeometry,
  Float32BufferAttribute,
} from 'three'
import { orbitalConfig } from './orbital-config'

// Import shaders
import starVertexShader from './shaders/star-vertex.glsl'
import starFragmentShader from './shaders/star-fragment.glsl'

// Get orbital configuration for synchronization
const { innerRadius, middleRadius, outerRadius, rotationSpeeds } = orbitalConfig

// Star data configuration
interface StarData {
  id: number
  r: number
  theta: number
  type: 'main-sequence' | 'blue-giant' | 'red-giant'
}

const stars: StarData[] = [
  // Middle orbit (r=3.0) - Blue Giants  
  { id: 0, r: middleRadius, theta: 288.0, type: 'blue-giant' },
  { id: 1, r: middleRadius, theta: 0.0, type: 'blue-giant' },
  { id: 2, r: middleRadius, theta: 72.0, type: 'blue-giant' },
  { id: 3, r: middleRadius, theta: 144.0, type: 'blue-giant' },
  { id: 4, r: middleRadius, theta: 216.0, type: 'blue-giant' },
  
  // Inner orbit (r=1.5) - Main Sequence
  { id: 5, r: innerRadius, theta: 288.0, type: 'main-sequence' },
  { id: 6, r: innerRadius, theta: 0.0, type: 'main-sequence' },
  { id: 7, r: innerRadius, theta: 72.0, type: 'main-sequence' },
  { id: 8, r: innerRadius, theta: 144.0, type: 'main-sequence' },
  { id: 9, r: innerRadius, theta: 216.0, type: 'main-sequence' },
  
  // Outer orbit (r=4.8) - Red Giants
  { id: 10, r: outerRadius, theta: 278.0, type: 'red-giant' },
  { id: 11, r: outerRadius, theta: 10.0, type: 'red-giant' },
  { id: 12, r: outerRadius, theta: 62.0, type: 'red-giant' },
  { id: 13, r: outerRadius, theta: 154.0, type: 'red-giant' },
  { id: 14, r: outerRadius, theta: 206.0, type: 'red-giant' },
  { id: 15, r: outerRadius, theta: 298.0, type: 'red-giant' },
  { id: 16, r: outerRadius, theta: 350.0, type: 'red-giant' },
  { id: 17, r: outerRadius, theta: 82.0, type: 'red-giant' },
  { id: 18, r: outerRadius, theta: 134.0, type: 'red-giant' },
  { id: 19, r: outerRadius, theta: 226.0, type: 'red-giant' }
]

// Star color configuration
const starColors = {
  'main-sequence': new Color('#FFD700'), // Gold - G-type main sequence star
  'blue-giant': new Color('#87CEEB'),    // Blue-white - B-type blue giant
  'red-giant': new Color('#FF4500')      // Orange-red - M-type red giant
}

// Star size configuration - minimal heartbeat amplitude
const starSizes = {
  'main-sequence': { min: 16, max: 18 },
  'blue-giant': { min: 22, max: 26 },
  'red-giant': { min: 28, max: 32 }
}

// Calculate star position
const calculateStarPosition = (r: number, theta: number) => {
  const radians = (theta * Math.PI) / 180
  const x = r * Math.cos(radians)
  const z = r * Math.sin(radians)
  const y = (Math.random() - 0.5) * 0.1 // Slight height variation
  return { x, y, z }
}

// Star shaders - now imported from external files

// References for storing star geometry and material
const starGeometry = ref()
const starMaterial = ref()
const starPoints = ref()

// Animation time and evolution state
let animationTime = 0
let animationId: number

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
    const color = starColors[star.type]
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
    
    // Start with small size (will grow during evolution)
    const sizeRange = starSizes[star.type]
    sizes[index] = sizeRange.min * 0.3 // Start small
    
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
      resolution: { value: [window.innerWidth, window.innerHeight, 1.0] }
    },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    blending: AdditiveBlending,
    depthTest: false,
    transparent: true
  })
  
  starGeometry.value = geometry
  starMaterial.value = material
}

// Animation loop with evolution and orbital rotation
const animate = () => {
  animationTime += 0.016 // ~60fps
  
  if (starMaterial.value && starGeometry.value) {
    starMaterial.value.uniforms.time.value = animationTime
    starMaterial.value.uniforms.evolutionTime.value = animationTime * 0.1 // Slower evolution
    
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
        
        // Evolve size from small to normal (minimal variation for stable centers)
        const sizeRange = starSizes[star.type]
        const baseSize = (sizeRange.min + sizeRange.max) * 0.5 // Use average for stable positioning
        const currentSize = baseSize * 0.3 + (baseSize - baseSize * 0.3) * evolutionProgress
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
</script>

<template>
  <TresGroup>
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
          :color="starColors[star.type]"
          :transparent="true"
          :opacity="0.8"
        />
      </TresMesh>
    </template>
  </TresGroup>
</template>
