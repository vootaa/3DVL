<script setup lang="ts">
import { AdditiveBlending, Points, ShaderMaterial, Vector3 } from 'three'
import { ref, watch, toRef } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { orbitalConfig, orbitalColorConfig } from '../../configs/orbital-config'

import vertexShader from '../../shaders/orbital-vertex.glsl'
import fragmentShader from '../../shaders/orbital-fragment.glsl'

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

// Use orbital configuration (stateless, driven by props)
const { totalCount, orbitParticleRatio, orbitDistribution, innerRadius, middleRadius, outerRadius, maxSpaceRadius, particleSize, rotationSpeeds } = orbitalConfig

// Initialize particle arrays (stateless data)
const positions = new Float32Array(totalCount * 3)
const colors = new Float32Array(totalCount * 3)
const scales = new Float32Array(totalCount)
const randomnessArray = new Float32Array(totalCount * 3)
const orbitFactors = new Float32Array(totalCount)
const targetRadii = new Float32Array(totalCount)
const rotationSpeedsArray = new Float32Array(totalCount)
const initialChaoticPositions = new Float32Array(totalCount * 3)

// Generate orbital particles (stateless initialization)
for (let i = 0; i < totalCount; i++) {
  const i3 = i * 3

  // Determine particle type: orbital (70%) or scattered (30%)
  const isOrbital = Math.random() < orbitParticleRatio
  orbitFactors[i] = isOrbital ? 1.0 : 0.0

  if (isOrbital) {
    // Orbital particle distribution setup
    const orbitChoice = Math.random()
    let targetRadius, particleColor, rotationSpeed

    if (orbitChoice < orbitDistribution.inner) {
      // Inner orbital ring
      targetRadius = innerRadius
      particleColor = orbitalColorConfig.innerRing.clone()
      particleColor.multiplyScalar(orbitalColorConfig.brightness.inner)
      rotationSpeed = rotationSpeeds.inner
    } else if (orbitChoice < orbitDistribution.inner + orbitDistribution.middle) {
      // Middle orbital ring  
      targetRadius = middleRadius
      particleColor = orbitalColorConfig.middleRing.clone()
      particleColor.multiplyScalar(orbitalColorConfig.brightness.middle)
      rotationSpeed = rotationSpeeds.middle
    } else {
      // Outer orbital ring
      targetRadius = outerRadius
      particleColor = orbitalColorConfig.outerRing.clone()
      particleColor.multiplyScalar(orbitalColorConfig.brightness.outer)
      rotationSpeed = rotationSpeeds.outer
    }

    targetRadii[i] = targetRadius
    rotationSpeedsArray[i] = rotationSpeed

    // Generate initial chaotic positions for evolution animation
    const initialRadius = Math.random() * maxSpaceRadius
    const initialAngle = Math.random() * Math.PI * 2
    const initialHeight = (Math.random() - 0.5) * 2.25

    initialChaoticPositions[i3] = Math.cos(initialAngle) * initialRadius
    initialChaoticPositions[i3 + 1] = initialHeight
    initialChaoticPositions[i3 + 2] = Math.sin(initialAngle) * initialRadius

    // Set initial positions based on evolution progress
    if (props.evolutionProgress >= 1.0) {
      // Fully evolved - orbital position
      const orbitAngle = Math.random() * Math.PI * 2
      positions[i3] = Math.cos(orbitAngle) * targetRadius
      positions[i3 + 1] = 0
      positions[i3 + 2] = Math.sin(orbitAngle) * targetRadius
    } else {
      // Evolving - chaotic position
      positions[i3] = initialChaoticPositions[i3]
      positions[i3 + 1] = initialChaoticPositions[i3 + 1]
      positions[i3 + 2] = initialChaoticPositions[i3 + 2]
    }

    // Set orbital particle colors
    colors[i3] = particleColor.r
    colors[i3 + 1] = particleColor.g
    colors[i3 + 2] = particleColor.b

    // Set orbital particle scales based on ring
    const baseScale = targetRadius === innerRadius ? 0.9 + Math.random() * 0.45
      : targetRadius === middleRadius ? 0.75 + Math.random() * 0.45
      : 0.6 + Math.random() * 0.3
    
    scales[i] = baseScale * (0.3 + 0.7 * props.evolutionProgress)
  } else {
    // Scattered particles setup
    const distributionChoice = Math.random()
    let scatteredColor

    if (distributionChoice < 0.4) {
      // Scattered near inner ring
      const baseRadius = innerRadius
      const radiusVariation = (Math.random() - 0.5) * 0.8
      const radius = Math.max(0.3, baseRadius + radiusVariation)
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 1.2

      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = height
      positions[i3 + 2] = Math.sin(angle) * radius

      scatteredColor = orbitalColorConfig.scatteredInner.clone()
    } else if (distributionChoice < 0.7) {
      // Scattered near middle ring
      const baseRadius = middleRadius
      const radiusVariation = (Math.random() - 0.5) * 1.0
      const radius = Math.max(0.5, baseRadius + radiusVariation)
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 1.5

      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = height
      positions[i3 + 2] = Math.sin(angle) * radius

      scatteredColor = orbitalColorConfig.scatteredMiddle.clone()
    } else {
      // Scattered near outer ring and beyond
      const baseRadius = outerRadius
      const radiusVariation = (Math.random() - 0.5) * 1.2
      const radius = Math.max(1.0, baseRadius + radiusVariation)
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 1.8

      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = height
      positions[i3 + 2] = Math.sin(angle) * radius

      scatteredColor = orbitalColorConfig.scatteredOuter.clone()
    }

    targetRadii[i] = 0.0 // No orbital motion for scattered particles
    rotationSpeedsArray[i] = 0.0

    // Set scattered particle colors
    const brightnessVariation = 0.8 + Math.random() * 0.4
    scatteredColor.multiplyScalar(orbitalColorConfig.brightness.scattered * brightnessVariation)
    colors[i3] = scatteredColor.r
    colors[i3 + 1] = scatteredColor.g
    colors[i3 + 2] = scatteredColor.b

    // Set scattered particle scales with evolution effect
    const scatteredScale = 1.35 + Math.random() * 0.75
    scales[i] = scatteredScale * (0.5 + 0.5 * props.evolutionProgress)
  }

  // Add randomness for natural distribution
  const randomStrength = 1.8
  const randomX = (Math.random() - 0.5) * randomStrength
  const randomY = (Math.random() - 0.5) * (randomStrength * 0.45)
  const randomZ = (Math.random() - 0.5) * randomStrength

  randomnessArray[i3] = randomX
  randomnessArray[i3 + 1] = randomY
  randomnessArray[i3 + 2] = randomZ
}

// Shader configuration for orbital particles
const shader = {
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  vertexColors: true,
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uEvolutionProgress: { value: props.evolutionProgress },
    uSize: { value: particleSize },
  },
}

const bufferRef = ref<InstanceType<typeof Points> | null>(null)

// Render loop for orbital system (stateless updates)
const { onLoop } = useRenderLoop()

onLoop(({ elapsed }) => {
  if (!props.enabled || !bufferRef.value) return
  
  // Update shader uniforms with current state
  const material = bufferRef.value.material as ShaderMaterial
  material.uniforms.uTime.value = props.globalTime
  material.uniforms.uEvolutionProgress.value = props.evolutionProgress

  // Update position relative to galaxy center
  if (galaxyCenter.value) {
    bufferRef.value.position.set(galaxyCenter.value.x, galaxyCenter.value.y, galaxyCenter.value.z)
  }

  // Update particle positions during evolution (stateless response to props)
  if (props.evolutionProgress < 1.0) {
    updateParticlePositions()
  }
})

// Update particle positions based on evolution progress (stateless function)
function updateParticlePositions() {
  if (!bufferRef.value) return
  
  const positionAttribute = bufferRef.value.geometry.getAttribute('position')
  const scaleAttribute = bufferRef.value.geometry.getAttribute('aScale')

  const positionArray = positionAttribute.array as Float32Array
  const scaleArray = scaleAttribute.array as Float32Array
  
  for (let i = 0; i < totalCount; i++) {
    const i3 = i * 3
    
    if (orbitFactors[i] > 0.5) { // Orbital particle
      const targetRadius = targetRadii[i]
      const rotationSpeed = rotationSpeedsArray[i]
      
      // Calculate target orbital position
      const currentAngle = props.globalTime * rotationSpeed
      const targetX = targetRadius * Math.cos(currentAngle)
      const targetY = 0
      const targetZ = targetRadius * Math.sin(currentAngle)
      
      // Interpolate from chaotic to orbital position based on evolution progress
      const startX = initialChaoticPositions[i3]
      const startY = initialChaoticPositions[i3 + 1]
      const startZ = initialChaoticPositions[i3 + 2]
      
      positionArray[i3] = startX + (targetX - startX) * props.evolutionProgress
      positionArray[i3 + 1] = startY + (targetY - startY) * props.evolutionProgress
      positionArray[i3 + 2] = startZ + (targetZ - startZ) * props.evolutionProgress
      
      // Update scale during evolution
      const baseScale = targetRadius === innerRadius ? 1.125
        : targetRadius === middleRadius ? 0.975
        : 0.75
        scaleArray[i] = baseScale * (0.3 + 0.7 * props.evolutionProgress)
    } else {
      // Scattered particles gradually become more visible
      const baseScale = 1.6
      scaleArray[i] = baseScale * (0.5 + 0.5 * props.evolutionProgress)
    }
  }
  
  positionAttribute.needsUpdate = true
  scaleAttribute.needsUpdate = true
}

// Watch for galaxy center changes
watch(galaxyCenter, (val) => {
  if (bufferRef.value && val) {
    bufferRef.value.position.set(val.x, val.y, val.z)
  }
})
</script>

<template>
  <TresPoints v-if="enabled" ref="bufferRef">
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
</template>
