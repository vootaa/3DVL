<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, AdditiveBlending, BufferAttribute, Points, ShaderMaterial } from 'three'
import gsap from 'gsap'
import { orbitalConfig, colorConfig } from './config'

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

// Use imported configuration
const { totalCount, orbitParticleRatio, innerRadius, middleRadius, outerRadius, maxSpaceRadius, particleSize, rotationSpeeds } = orbitalConfig

const positions = new Float32Array(totalCount * 3)
const colors = new Float32Array(totalCount * 3)
const scales = new Float32Array(totalCount)
const randomnessArray = new Float32Array(totalCount * 3)
const orbitFactors = new Float32Array(totalCount)
const targetRadii = new Float32Array(totalCount)
const rotationSpeedsArray = new Float32Array(totalCount)

// Generate particles
for (let i = 0; i < totalCount; i++) {
  const i3 = i * 3
  
  // Determine if this particle will be orbital (70%) or scattered (30%)
  const isOrbital = Math.random() < orbitParticleRatio
  orbitFactors[i] = isOrbital ? 1.0 : 0.0
  
  if (isOrbital) {
    // Assign to one of three orbits - equal distribution for clear ring visibility
    const orbitChoice = Math.random()
    let targetRadius
    let particleColor
    let rotationSpeed
    
    if (orbitChoice < 0.33) {
      // Inner orbit
      targetRadius = innerRadius
      particleColor = colorConfig.innerRing.clone()
      particleColor.multiplyScalar(colorConfig.brightness.inner)
      rotationSpeed = rotationSpeeds.inner
    } else if (orbitChoice < 0.66) {
      // Middle orbit
      targetRadius = middleRadius
      particleColor = colorConfig.middleRing.clone()
      particleColor.multiplyScalar(colorConfig.brightness.middle)
      rotationSpeed = rotationSpeeds.middle
    } else {
      // Outer orbit
      targetRadius = outerRadius
      particleColor = colorConfig.outerRing.clone()
      particleColor.multiplyScalar(colorConfig.brightness.outer)
      rotationSpeed = rotationSpeeds.outer
    }
    
    targetRadii[i] = targetRadius
    rotationSpeedsArray[i] = rotationSpeed
    
    // Start from completely random chaotic positions within the space
    const initialRadius = Math.random() * maxSpaceRadius
    const initialAngle = Math.random() * Math.PI * 2
    const initialHeight = (Math.random() - 0.5) * 6
    
    positions[i3] = Math.cos(initialAngle) * initialRadius
    positions[i3 + 1] = initialHeight
    positions[i3 + 2] = Math.sin(initialAngle) * initialRadius
    
    colors[i3] = particleColor.r
    colors[i3 + 1] = particleColor.g
    colors[i3 + 2] = particleColor.b
    
    // Larger scale for brighter ring appearance with some variation
    scales[i] = 1.0 + Math.random() * 0.5
  } else {
    // Scattered particles - distributed throughout the 3D space
    const radius = Math.random() * maxSpaceRadius
    const angle = Math.random() * Math.PI * 2
    const height = (Math.random() - 0.5) * (maxSpaceRadius * 0.8) // Slightly flattened distribution
    
    positions[i3] = Math.cos(angle) * radius
    positions[i3 + 1] = height
    positions[i3 + 2] = Math.sin(angle) * radius
    
    targetRadii[i] = 0.0 // No target radius for scattered particles
    rotationSpeedsArray[i] = 0.0 // No rotation for scattered particles
    
    // Use dimmer color from same family
    const scatteredColor = colorConfig.scattered.clone()
    scatteredColor.multiplyScalar(colorConfig.brightness.scattered)
    colors[i3] = scatteredColor.r
    colors[i3 + 1] = scatteredColor.g
    colors[i3 + 2] = scatteredColor.b
    
    scales[i] = 0.3 + Math.random() * 0.3
  }
  
  // Add initial randomness for chaotic start (reduced for clearer evolution)
  const randomStrength = 1.5
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
      value: particleSize,
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
    <TresPerspectiveCamera :position="[8, 6, 8]" />
    <TresPoints ref="bufferRef">
      <TresBufferGeometry
        :position="[positions, 3]"
        :a-scale="[scales, 1]"
        :color="[colors, 3]"
        :a-randomness="[randomnessArray, 3]"
        :a-orbit-factor="[orbitFactors, 1]"
        :a-target-radius="[targetRadii, 1]"
        :a-rotation-speed="[rotationSpeedsArray, 1]"
      />
      <TresShaderMaterial v-bind="shader" />
    </TresPoints>
    <OrbitControls />
  </TresCanvas>
</template>
