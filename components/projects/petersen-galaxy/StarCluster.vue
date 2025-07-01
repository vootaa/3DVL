<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  Color,
  AdditiveBlending, 
  ShaderMaterial,
  BufferGeometry,
  Float32BufferAttribute,
} from 'three'

// Import shaders
import starVertexShader from './shaders/star-vertex.glsl'
import starFragmentShader from './shaders/star-fragment.glsl'

// Star data configuration
interface StarData {
  id: number
  r: number
  theta: number
  type: 'main-sequence' | 'blue-giant' | 'red-giant'
}

const stars: StarData[] = [
  // Middle orbit (r=0.300) - Blue Giants
  { id: 0, r: 3.0, theta: 288.0, type: 'blue-giant' },
  { id: 1, r: 3.0, theta: 0.0, type: 'blue-giant' },
  { id: 2, r: 3.0, theta: 72.0, type: 'blue-giant' },
  { id: 3, r: 3.0, theta: 144.0, type: 'blue-giant' },
  { id: 4, r: 3.0, theta: 216.0, type: 'blue-giant' },
  
  // Inner orbit (r=0.150) - Main Sequence
  { id: 5, r: 1.5, theta: 288.0, type: 'main-sequence' },
  { id: 6, r: 1.5, theta: 0.0, type: 'main-sequence' },
  { id: 7, r: 1.5, theta: 72.0, type: 'main-sequence' },
  { id: 8, r: 1.5, theta: 144.0, type: 'main-sequence' },
  { id: 9, r: 1.5, theta: 216.0, type: 'main-sequence' },
  
  // Outer orbit (r=0.480) - Red Giants
  { id: 10, r: 4.8, theta: 278.0, type: 'red-giant' },
  { id: 11, r: 4.8, theta: 10.0, type: 'red-giant' },
  { id: 12, r: 4.8, theta: 62.0, type: 'red-giant' },
  { id: 13, r: 4.8, theta: 154.0, type: 'red-giant' },
  { id: 14, r: 4.8, theta: 206.0, type: 'red-giant' },
  { id: 15, r: 4.8, theta: 298.0, type: 'red-giant' },
  { id: 16, r: 4.8, theta: 350.0, type: 'red-giant' },
  { id: 17, r: 4.8, theta: 82.0, type: 'red-giant' },
  { id: 18, r: 4.8, theta: 134.0, type: 'red-giant' },
  { id: 19, r: 4.8, theta: 226.0, type: 'red-giant' }
]

// Star color configuration
const starColors = {
  'main-sequence': new Color('#FFD700'), // Gold - G-type main sequence star
  'blue-giant': new Color('#87CEEB'),    // Blue-white - B-type blue giant
  'red-giant': new Color('#FF4500')      // Orange-red - M-type red giant
}

// Star size configuration
const starSizes = {
  'main-sequence': { min: 18, max: 28 },
  'blue-giant': { min: 25, max: 40 },
  'red-giant': { min: 35, max: 55 }
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

// Animation time
let animationTime = 0
let animationId: number

// Initialize star system
const initStars = () => {
  const geometry = new BufferGeometry()
  
  const positions = new Float32Array(stars.length * 3)
  const colors = new Float32Array(stars.length * 3)
  const sizes = new Float32Array(stars.length)
  const alphas = new Float32Array(stars.length)
  const times = new Float32Array(stars.length)
  const pulseOffsets = new Float32Array(stars.length)
  
  stars.forEach((star, index) => {
    const position = calculateStarPosition(star.r, star.theta)
    const i3 = index * 3
    
    // Position
    positions[i3] = position.x
    positions[i3 + 1] = position.y
    positions[i3 + 2] = position.z
    
    // Color
    const color = starColors[star.type]
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
    
    // Size - based on star type
    const sizeRange = starSizes[star.type]
    sizes[index] = sizeRange.min + Math.random() * (sizeRange.max - sizeRange.min)
    
    // Brightness
    alphas[index] = 0.8 + Math.random() * 0.2
    
    // Time offset (for twinkling effect)
    times[index] = Math.random() * Math.PI * 2
    
    // Pulse offset
    pulseOffsets[index] = Math.random() * Math.PI * 2
  })
  
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('customColor', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('size', new Float32BufferAttribute(sizes, 1))
  geometry.setAttribute('alpha', new Float32BufferAttribute(alphas, 1))
  geometry.setAttribute('time', new Float32BufferAttribute(times, 1))
  geometry.setAttribute('pulseOffset', new Float32BufferAttribute(pulseOffsets, 1))
  
  const material = new ShaderMaterial({
    uniforms: {
      time: { value: 0 },
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

// Animation loop
const animate = () => {
  animationTime += 0.016 // ~60fps
  
  if (starMaterial.value) {
    starMaterial.value.uniforms.time.value = animationTime
    
    // Update time attribute for twinkling effect
    const times = starGeometry.value.getAttribute('time')
    if (times) {
      for (let i = 0; i < times.count; i++) {
        times.array[i] += 0.02 + Math.random() * 0.01
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
