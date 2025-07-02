<script setup lang="ts">
import { AdditiveBlending, Points, ShaderMaterial, Vector3 } from 'three'
import { ref, inject } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { orbitalConfig, orbitalColorConfig } from '../configs/orbital-config'
import { Logger } from '../../../utils/logger'
import { LoggingConfig } from '../configs/logging-config'

import vertexShader from '../shaders/orbital-vertex.glsl'
import fragmentShader from '../shaders/orbital-fragment.glsl'

// Inject galaxy center position with error handling
const galaxyCenter = inject('galaxyCenter', ref(new Vector3(0, 0, 0)))

// Validate galaxy center injection
if (!galaxyCenter || !galaxyCenter.value) {
  Logger.error('ORBITAL_SYSTEM', 'Failed to inject galaxyCenter from GalaxyDriftController', {
    galaxyCenter,
    hasValue: !!galaxyCenter?.value,
    type: typeof galaxyCenter
  })
} else {
  Logger.log('ORBITAL_SYSTEM', 'Successfully injected galaxyCenter', {
    initialPosition: {
      x: galaxyCenter.value.x.toFixed(3),
      y: galaxyCenter.value.y.toFixed(3),
      z: galaxyCenter.value.z.toFixed(3)
    }
  })
}

// Use imported configuration
const { totalCount, orbitParticleRatio, orbitDistribution, innerRadius, middleRadius, outerRadius, maxSpaceRadius, particleSize, rotationSpeeds } = orbitalConfig

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
    // Assign to one of three orbits with optimized distribution:
    // Inner ring: 17.5% of orbital particles (reduced for better middle/outer density)
    // Middle ring: 52.5% of orbital particles (increased by 50%)
    // Outer ring: 30.0% of orbital particles (increased by 100%)
    const orbitChoice = Math.random()
    let targetRadius
    let particleColor
    let rotationSpeed

    if (orbitChoice < orbitDistribution.inner) {
      // Inner orbit - reduced particles (17.5% of orbital particles)
      targetRadius = innerRadius
      particleColor = orbitalColorConfig.innerRing.clone()
      particleColor.multiplyScalar(orbitalColorConfig.brightness.inner)
      rotationSpeed = rotationSpeeds.inner
    } else if (orbitChoice < orbitDistribution.inner + orbitDistribution.middle) {
      // Middle orbit - enhanced particles (52.5% of orbital particles, +50% increase)
      targetRadius = middleRadius
      particleColor = orbitalColorConfig.middleRing.clone()
      particleColor.multiplyScalar(orbitalColorConfig.brightness.middle)
      rotationSpeed = rotationSpeeds.middle
    } else {
      // Outer orbit - doubled particles (30.0% of orbital particles, +100% increase)
      targetRadius = outerRadius
      particleColor = orbitalColorConfig.outerRing.clone()
      particleColor.multiplyScalar(orbitalColorConfig.brightness.outer)
      rotationSpeed = rotationSpeeds.outer
    }

    targetRadii[i] = targetRadius
    rotationSpeedsArray[i] = rotationSpeed

    // Start from completely random chaotic positions within the space
    const initialRadius = Math.random() * maxSpaceRadius
    const initialAngle = Math.random() * Math.PI * 2
    const initialHeight = (Math.random() - 0.5) * 2.25 // Increased height distribution (+50% thicker disk)

    positions[i3] = Math.cos(initialAngle) * initialRadius
    positions[i3 + 1] = initialHeight
    positions[i3 + 2] = Math.sin(initialAngle) * initialRadius

    colors[i3] = particleColor.r
    colors[i3 + 1] = particleColor.g
    colors[i3 + 2] = particleColor.b

    // Increased scale for larger particles (+50%)
    if (targetRadius === innerRadius) {
      scales[i] = 0.9 + Math.random() * 0.45 // Inner ring - increased from 0.6-0.9 to 0.9-1.35
    } else if (targetRadius === middleRadius) {
      scales[i] = 0.75 + Math.random() * 0.45 // Middle ring - increased from 0.5-0.8 to 0.75-1.2
    } else {
      scales[i] = 0.6 + Math.random() * 0.3 // Outer ring - increased from 0.4-0.6 to 0.6-0.9
    }
  } else {
    // Scattered particles - positioned close to ring areas with same color family
    const distributionChoice = Math.random()
    let scatteredColor

    if (distributionChoice < 0.4) {
      // Close to inner ring area
      const baseRadius = innerRadius
      const radiusVariation = (Math.random() - 0.5) * 0.8 // ±0.4 variation
      const radius = Math.max(0.3, baseRadius + radiusVariation)
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 1.2 // Increased height for thicker disk (+50%)

      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = height
      positions[i3 + 2] = Math.sin(angle) * radius

      scatteredColor = orbitalColorConfig.scatteredInner.clone()
    } else if (distributionChoice < 0.7) {
      // Close to middle ring area
      const baseRadius = middleRadius
      const radiusVariation = (Math.random() - 0.5) * 1.0 // ±0.5 variation
      const radius = Math.max(0.5, baseRadius + radiusVariation)
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 1.5 // Increased height for thicker disk (+50%)

      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = height
      positions[i3 + 2] = Math.sin(angle) * radius

      scatteredColor = orbitalColorConfig.scatteredMiddle.clone()
    } else {
      // Close to outer ring area and beyond
      const baseRadius = outerRadius
      const radiusVariation = (Math.random() - 0.5) * 1.2 // ±0.6 variation
      const radius = Math.max(1.0, baseRadius + radiusVariation)
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 1.8 // Increased height for thicker disk (+50%)

      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = height
      positions[i3 + 2] = Math.sin(angle) * radius

      scatteredColor = orbitalColorConfig.scatteredOuter.clone()
    }

    targetRadii[i] = 0.0 // No target radius for scattered particles
    rotationSpeedsArray[i] = 0.0 // No rotation for scattered particles

    // Apply dimmer brightness for scattered particles
    const brightnessVariation = 0.8 + Math.random() * 0.4
    scatteredColor.multiplyScalar(orbitalColorConfig.brightness.scattered * brightnessVariation)
    colors[i3] = scatteredColor.r
    colors[i3 + 1] = scatteredColor.g
    colors[i3 + 2] = scatteredColor.b

    // Increased scales for scattered particles (+50% size)
    scales[i] = 1.35 + Math.random() * 0.75 // Increased from 0.9-1.4 to 1.35-2.1
  }

  // Increased initial randomness for thicker ring formation and disk (+50%)
  const randomStrength = 1.8 // Increased from 1.2
  const randomX = (Math.random() - 0.5) * randomStrength
  const randomY = (Math.random() - 0.5) * (randomStrength * 0.45) // Increased Y variation for thicker disk
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
    
    // Apply galaxy center drift with error handling
    try {
      if (galaxyCenter?.value) {
        const center = galaxyCenter.value
        bufferRef.value.position.set(center.x, center.y, center.z)
        
        // Use Logger.throttle for consistent logging
        Logger.throttle('ORBITAL_DRIFT', 'Galaxy center applied to orbital system', {
          position: {
            x: center.x.toFixed(6),
            y: center.y.toFixed(6),
            z: center.z.toFixed(6)
          },
          timestamp: elapsed.toFixed(2)
        }, LoggingConfig.ORBITAL_DRIFT) // Use centralized config
        
      } else {
        Logger.warn('ORBITAL_SYSTEM', 'Galaxy center is not available, using default position (0,0,0)')
        bufferRef.value.position.set(0, 0, 0)
      }
    } catch (error) {
      Logger.error('ORBITAL_SYSTEM', 'Error applying galaxy center drift to orbital system', error)
      // Fallback to default position
      bufferRef.value.position.set(0, 0, 0)
    }
  }
})
</script>

<template>
  <TresPoints ref="bufferRef">
    <TresBufferGeometry :position="[positions, 3]" :a-scale="[scales, 1]" :color="[colors, 3]"
      :a-randomness="[randomnessArray, 3]" :a-orbit-factor="[orbitFactors, 1]" :a-target-radius="[targetRadii, 1]"
      :a-rotation-speed="[rotationSpeedsArray, 1]" />
    <TresShaderMaterial v-bind="shader" />
  </TresPoints>
</template>
