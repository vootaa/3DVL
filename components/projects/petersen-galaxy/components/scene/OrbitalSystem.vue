<script setup lang="ts">
import { AdditiveBlending, Points, ShaderMaterial, Vector3 } from 'three'
import { ref, toRef } from 'vue'
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
  galaxyCenter: () => new Vector3(1, 1, 0),
  globalTime: 0,
  evolutionProgress: 0,
  enabled: true
})

const galaxyCenter = toRef(props, 'galaxyCenter')

const { totalCount, orbitParticleRatio, orbitDistribution, innerRadius, middleRadius, outerRadius, maxSpaceRadius, particleSize, rotationSpeed } = orbitalConfig

const positions = new Float32Array(totalCount * 3)
const colors = new Float32Array(totalCount * 3)
const scales = new Float32Array(totalCount)
const randomnessArray = new Float32Array(totalCount * 3)
const orbitFactors = new Float32Array(totalCount)
const targetRadii = new Float32Array(totalCount)

for (let i = 0; i < totalCount; i++) {
  const i3 = i * 3
  const isOrbital = Math.random() < orbitParticleRatio
  orbitFactors[i] = isOrbital ? 1.0 : 0.0

  if (isOrbital) {
    const orbitChoice = Math.random()
    let targetRadius, particleColor

    if (orbitChoice < orbitDistribution.inner) {
      targetRadius = innerRadius
      particleColor = orbitalColorConfig.innerRing.clone()
      particleColor.multiplyScalar(orbitalColorConfig.brightness.inner)
    } else if (orbitChoice < orbitDistribution.inner + orbitDistribution.middle) {
      targetRadius = middleRadius
      particleColor = orbitalColorConfig.middleRing.clone()
      particleColor.multiplyScalar(orbitalColorConfig.brightness.middle)
    } else {
      targetRadius = outerRadius
      particleColor = orbitalColorConfig.outerRing.clone()
      particleColor.multiplyScalar(orbitalColorConfig.brightness.outer)
    }

    targetRadii[i] = targetRadius

    const initialRadius = Math.random() * maxSpaceRadius
    const initialAngle = Math.random() * Math.PI * 2
    const initialHeight = (Math.random() - 0.5) * 2.25

    positions[i3] = Math.cos(initialAngle) * initialRadius
    positions[i3 + 1] = initialHeight
    positions[i3 + 2] = Math.sin(initialAngle) * initialRadius

    colors[i3] = particleColor.r
    colors[i3 + 1] = particleColor.g
    colors[i3 + 2] = particleColor.b

    if (targetRadius === innerRadius) {
      scales[i] = 0.9 + Math.random() * 0.45
    } else if (targetRadius === middleRadius) {
      scales[i] = 0.75 + Math.random() * 0.45
    } else {
      scales[i] = 0.6 + Math.random() * 0.3
    }
  } else {
    const distributionChoice = Math.random()
    let scatteredColor

    if (distributionChoice < 0.4) {
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

    targetRadii[i] = 0.0

    const brightnessVariation = 0.8 + Math.random() * 0.4
    scatteredColor.multiplyScalar(orbitalColorConfig.brightness.scattered * brightnessVariation)
    colors[i3] = scatteredColor.r
    colors[i3 + 1] = scatteredColor.g
    colors[i3 + 2] = scatteredColor.b

    scales[i] = 1.35 + Math.random() * 0.75
  }

  const randomStrength = 1.8
  const randomX = (Math.random() - 0.5) * randomStrength
  const randomY = (Math.random() - 0.5) * (randomStrength * 0.45)
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
    uEvolutionProgress: { value: 0 },
    uSize: { value: particleSize },
    uBaseRotationSpeed: { value: rotationSpeed },
  },
}

const bufferRef = ref<InstanceType<typeof Points> | null>(null)

const { onLoop } = useRenderLoop()
onLoop(() => {
  if (!props.enabled || !bufferRef.value) return

  const material = bufferRef.value.material as ShaderMaterial
  
  material.uniforms.uTime.value = props.globalTime
  material.uniforms.uEvolutionProgress.value = props.evolutionProgress

  if (galaxyCenter?.value) {
    bufferRef.value.position.set(galaxyCenter.value.x, galaxyCenter.value.y, galaxyCenter.value.z)
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
    />
    <TresShaderMaterial v-bind="shader" />
  </TresPoints>
</template>