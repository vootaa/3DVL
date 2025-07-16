<script setup lang="ts">
import { ref, toRef } from 'vue'
import { AdditiveBlending, Points, ShaderMaterial, Vector3 } from 'three'
import { useRenderLoop } from '@tresjs/core'

import { orbitalConfig, orbitalColorConfig } from '../../configs/orbital-config'
import { RotationManager } from '../../composables/rotationManager'
import { Logger } from '../../../../utils/logger'

import vertexShader from '../../shaders/orbital-vertex.glsl'
import fragmentShader from '../../shaders/orbital-fragment.glsl'

interface Props {
  galaxyCenter?: Vector3
  globalTime?: number
  evolutionProgress?: number
  enabled?: boolean
  cameraRef?: any
}

const props = withDefaults(defineProps<Props>(), {
  galaxyCenter: () => new Vector3(1, 1, 0),
  globalTime: 0,
  evolutionProgress: 0,
  enabled: true,
  cameraRef: null
})

const galaxyCenter = toRef(props, 'galaxyCenter')

// Get rotation manager instance
const rotationManager = RotationManager.getInstance()

const { totalCount } = orbitalConfig

const positions = new Float32Array(totalCount * 3)
const particleIds = new Float32Array(totalCount)

for (let i = 0; i < totalCount; i++) {
  const i3 = i * 3

  const initialRadius = Math.random() * orbitalConfig.maxSpaceRadius
  const initialAngle = Math.random() * Math.PI * 2
  const initialHeight = (Math.random() - 0.5) * 5.0 // Random height between -2.5 and 2.5

  positions[i3] = Math.cos(initialAngle) * initialRadius
  positions[i3 + 1] = initialHeight
  positions[i3 + 2] = Math.sin(initialAngle) * initialRadius

  particleIds[i] = i
}

const shader = {
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  vertexColors: true,
  vertexShader,
  fragmentShader,
  uniforms: {
    ...rotationManager.getShaderUniforms(),
    uParticleSize: { value: orbitalConfig.particleSize },

    uOrbitParticleRatio: { value: orbitalConfig.orbitParticleRatio },
    uInnerRadius: { value: orbitalConfig.innerRadius },
    uMiddleRadius: { value: orbitalConfig.middleRadius },
    uOuterRadius: { value: orbitalConfig.outerRadius },
    uMaxSpaceRadius: { value: orbitalConfig.maxSpaceRadius },

    uOrbitDistributionInner: { value: orbitalConfig.orbitDistribution.inner },
    uOrbitDistributionMiddle: { value: orbitalConfig.orbitDistribution.middle },

    uInnerRingColor: { value: orbitalColorConfig.innerRing },
    uMiddleRingColor: { value: orbitalColorConfig.middleRing },
    uOuterRingColor: { value: orbitalColorConfig.outerRing },
    uScatteredInnerColor: { value: orbitalColorConfig.scatteredInner },
    uScatteredMiddleColor: { value: orbitalColorConfig.scatteredMiddle },
    uScatteredOuterColor: { value: orbitalColorConfig.scatteredOuter },

    uBrightnessInner: { value: orbitalColorConfig.brightness.inner },
    uBrightnessMiddle: { value: orbitalColorConfig.brightness.middle },
    uBrightnessOuter: { value: orbitalColorConfig.brightness.outer },
    uBrightnessScattered: { value: orbitalColorConfig.brightness.scattered },
  },
}

const bufferRef = ref<InstanceType<typeof Points> | null>(null)

const { onLoop } = useRenderLoop()
onLoop(() => {
  try {
    if (!props.enabled || !bufferRef.value) return

    // Update rotation manager
    rotationManager.updateTime(props.globalTime)
    rotationManager.updateEvolution(props.evolutionProgress)

    const material = bufferRef.value.material as ShaderMaterial
    const shaderUniforms = rotationManager.getShaderUniforms()
    
    // Update shader uniforms from rotation manager
    Object.keys(shaderUniforms).forEach(key => {
      if (material.uniforms[key]) {
        material.uniforms[key].value = shaderUniforms[key].value
      }
    })

    if (galaxyCenter?.value) {
      bufferRef.value.position.set(galaxyCenter.value.x, galaxyCenter.value.y, galaxyCenter.value.z)
    }
  } catch (error) {
    Logger.error('Orbital', 'Error in Orbital System render loop', error)
  }
})
</script>

<template>
  <TresPoints v-if="enabled" ref="bufferRef">
    <TresBufferGeometry :position="[positions, 3]" :a-particle-id="[particleIds, 1]" />
    <TresShaderMaterial v-bind="shader" />
  </TresPoints>
</template>