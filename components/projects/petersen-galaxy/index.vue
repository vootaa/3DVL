<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, Color, AdditiveBlending, Points, ShaderMaterial } from 'three'
import gsap from 'gsap'

import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

const gl = {
  clearColor: 'black',
  shadows: true,
  alpha: false,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
}

const parameters = {
  count: 30000,
  size: 12,
  innerRadius: 1.5,   // 0.15 * 10 for better visibility
  middleRadius: 3.0,  // 0.3 * 10
  outerRadius: 4.8,   // 0.48 * 10
  chaoticSpread: 12.0,
  orbitParticleRatio: 0.75, // 75% of particles will eventually form orbits
}

// Colors for different regions - brighter at center
const centerColor = new Color('#ffffff')    // Pure white at center
const innerColor = new Color('#ffeb3b')     // Bright yellow for inner orbit
const middleColor = new Color('#ff5722')    // Red-orange for middle orbit
const outerColor = new Color('#9c27b0')     // Purple for outer orbit
const chaoticColor = new Color('#2196f3')   // Blue for chaotic particles

const positions = new Float32Array(parameters.count * 3)
const colors = new Float32Array(parameters.count * 3)
const scales = new Float32Array(parameters.count)
const randomnessArray = new Float32Array(parameters.count * 3)
const orbitFactors = new Float32Array(parameters.count)
const targetRadii = new Float32Array(parameters.count)

// Generate particles
for (let i = 0; i < parameters.count; i++) {
  const i3 = i * 3
  
  // Determine if this particle will be orbital or chaotic
  const isOrbital = Math.random() < parameters.orbitParticleRatio
  orbitFactors[i] = isOrbital ? 1.0 : 0.0
  
  if (isOrbital) {
    // Assign to one of three orbits with uneven distribution
    const orbitChoice = Math.random()
    let targetRadius
    let particleColor
    let brightness
    
    if (orbitChoice < 0.45) {
      // Inner orbit (45% of orbital particles) - highest density
      targetRadius = parameters.innerRadius
      brightness = 0.9 + Math.random() * 0.1 // Very bright
      particleColor = centerColor.clone().lerp(innerColor, Math.random() * 0.2)
    } else if (orbitChoice < 0.75) {
      // Middle orbit (30% of orbital particles)
      targetRadius = parameters.middleRadius
      brightness = 0.7 + Math.random() * 0.3
      particleColor = innerColor.clone().lerp(middleColor, Math.random() * 0.6)
    } else {
      // Outer orbit (25% of orbital particles)
      targetRadius = parameters.outerRadius
      brightness = 0.5 + Math.random() * 0.5
      particleColor = middleColor.clone().lerp(outerColor, Math.random() * 0.8)
    }
    
    targetRadii[i] = targetRadius
    
    // Start from completely random chaotic positions
    const initialRadius = Math.random() * parameters.chaoticSpread
    const initialAngle = Math.random() * Math.PI * 2
    const initialHeight = (Math.random() - 0.5) * 8
    
    positions[i3] = Math.cos(initialAngle) * initialRadius
    positions[i3 + 1] = initialHeight
    positions[i3 + 2] = Math.sin(initialAngle) * initialRadius
    
    // Apply brightness to color
    particleColor.multiplyScalar(brightness)
    colors[i3] = particleColor.r
    colors[i3 + 1] = particleColor.g
    colors[i3 + 2] = particleColor.b
    
    // Create irregular distribution using noise-like patterns
    // Use position-based pseudo-random for consistent clustering
    const clusterSeed = Math.sin(i * 0.1) * Math.cos(i * 0.07)
    const clusterFactor = (clusterSeed + 1.0) * 0.5 // Normalize to 0-1
    const densityBias = Math.pow(clusterFactor, 0.3) // Create natural clustering
    scales[i] = 0.2 + densityBias * 1.0
  } else {
    // Chaotic particles - remain scattered throughout space
    const radius = Math.random() * parameters.chaoticSpread
    const angle = Math.random() * Math.PI * 2
    const height = (Math.random() - 0.5) * 10
    
    positions[i3] = Math.cos(angle) * radius
    positions[i3 + 1] = height
    positions[i3 + 2] = Math.sin(angle) * radius
    
    targetRadii[i] = 0.0 // No target radius for chaotic particles
    
    const dimness = 0.3 + Math.random() * 0.4
    const dimmedColor = chaoticColor.clone().multiplyScalar(dimness)
    colors[i3] = dimmedColor.r
    colors[i3 + 1] = dimmedColor.g
    colors[i3 + 2] = dimmedColor.b
    
    scales[i] = 0.2 + Math.random() * 0.4
  }
  
  // Add strong initial randomness for chaotic start
  const randomStrength = 3.0
  const randomX = (Math.random() - 0.5) * randomStrength
  const randomY = (Math.random() - 0.5) * randomStrength
  const randomZ = (Math.random() - 0.5) * randomStrength
  
  randomnessArray[i3] = randomX
  randomnessArray[i3 + 1] = randomY
  randomnessArray[i3 + 2] = randomZ
}

const shader = {
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  vertexColors: true,
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uSize: {
      value: parameters.size,
    },
  },
}

const bufferRef = ref<InstanceType<typeof Points> | null>(null)

const { onLoop } = useRenderLoop()

onLoop(({ elapsed }) => {
  if (bufferRef.value) {
    const material = bufferRef.value.material as ShaderMaterial
    material.uniforms.uTime.value = elapsed
  }
})

onMounted(() => {
  gsap.to('.title', {
    delay: 0.5,
    opacity: 1,
    y: 2,
    display: 'block',
    duration: 0.5,
    ease: 'expo.out',
  })
})
</script>

<template>
  <h1
    class="title font-title text-6xl text-white fixed top-8 transform w-full text-center display-none opacity-0 z-10 pointer-events-none"
  >
    Petersen Galaxy Evolution 🌌
  </h1>
  <TresCanvas v-bind="gl">
    <TresPerspectiveCamera :position="[6, 4, 6]" />
    <TresPoints ref="bufferRef">
      <TresBufferGeometry
        :position="[positions, 3]"
        :a-scale="[scales, 1]"
        :color="[colors, 3]"
        :a-randomness="[randomnessArray, 3]"
        :a-orbit-factor="[orbitFactors, 1]"
        :a-target-radius="[targetRadii, 1]"
      />
      <TresShaderMaterial v-bind="shader" />
    </TresPoints>
    <OrbitControls />
  </TresCanvas>
</template>
