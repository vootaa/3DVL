<script setup lang="ts">
import { ref, toRef } from 'vue'
import { AdditiveBlending, Points, ShaderMaterial, Vector3 } from 'three'
import { useRenderLoop } from '@tresjs/core'

import { orbitalConfig, orbitalColorConfig } from '../../configs/orbital-config'
import { getCurrentLODLevel } from '../../configs/lodlevel-config'
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

const { totalCount } = orbitalConfig

const positions = new Float32Array(totalCount * 3)
const particleIds = new Float32Array(totalCount) // Used as a seed for generating random numbers in the shader

for (let i = 0; i < totalCount; i++) {
  const i3 = i * 3

  const initialRadius = Math.random() * orbitalConfig.maxSpaceRadius
  const initialAngle = Math.random() * Math.PI * 2
  const initialHeight = (Math.random() - 0.5) * 2.25

  positions[i3] = Math.cos(initialAngle) * initialRadius
  positions[i3 + 1] = initialHeight
  positions[i3 + 2] = Math.sin(initialAngle) * initialRadius

  // Particle ID as random seed
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
    uTime: { value: 0 },
    uEvolutionProgress: { value: 0 },
    uParticleSize: { value: orbitalConfig.particleSize },
    uBaseRotationSpeed: { value: orbitalConfig.rotationSpeed },

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
const cameraDistance = ref(1000)

const { onLoop } = useRenderLoop()
onLoop(() => {
  try {
    if (!props.enabled || !bufferRef.value) return

    const material = bufferRef.value.material as ShaderMaterial

    material.uniforms.uTime.value = props.globalTime
    material.uniforms.uEvolutionProgress.value = props.evolutionProgress

    if (galaxyCenter?.value) {
      bufferRef.value.position.set(galaxyCenter.value.x, galaxyCenter.value.y, galaxyCenter.value.z)
    }

    if (bufferRef.value && props.cameraRef?.value) {
      try {
        const cameraPos = props.cameraRef.value.position
        const corePos = bufferRef.value.position

        if (cameraPos && corePos && typeof cameraPos.distanceTo === 'function') {
          cameraDistance.value = cameraPos.distanceTo(corePos)
        }
      } catch (e) {
        Logger.throttle('Orbital_CAMERA', 'Camera distance calculation failed')
      }
    }

    // LOD application
    try {
      const lodLevel = getCurrentLODLevel(cameraDistance.value, 'orbital')
      if (material) {
        material.uniforms.uParticleSize.value = lodLevel.particleSize || 15
      }
    } catch (e) {
      Logger.throttle('TETHERS_LOD', 'LOD calculation failed')
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