<script setup lang="ts">
import { shallowRef} from 'vue'
import { DoubleSide, ShaderMaterial, Vector2 } from 'three'
import { useLoop } from '@tresjs/core'

import sinusoidalVertexShader from '../../shaders/sinusoidal-vertex.glsl'
import sinusoidalFragmentShader from '../../shaders/sinusoidal-fragment.glsl'

interface Props {
  position?: [number, number, number]
  scale?: [number, number, number]
  rotation?: [number, number, number]
  cylinderArgs?: [number, number, number, number]
}

const props = withDefaults(defineProps<Props>(), {
  position: () => [0, 0, 0],
  scale: () => [1, 1, 1],
  rotation: () => [0, 0, 0],
  cylinderArgs: () => [1, 2, 32, 1]
})

const material = shallowRef<ShaderMaterial>()
const clock = { getElapsedTime: () => Date.now() / 1000 }

const uniforms = {
  iResolution: { value: new Vector2(1000, 1280) },
  iTime: { value: 0 },
}

// Initialize material
material.value = new ShaderMaterial({
  vertexShader: sinusoidalVertexShader,
  fragmentShader: sinusoidalFragmentShader,
  uniforms,
  side: DoubleSide,
  transparent: true
})

useLoop().onBeforeRender(() => {
  if (uniforms.iTime) {
    uniforms.iTime.value = clock.getElapsedTime()
  }
})

// Cleanup
onUnmounted(() => {
  if (material.value) {
    material.value.dispose()
  }
})
</script>

<template>
  <TresMesh
    :position="position"
    :scale="scale"
    :rotation="rotation"
    :material="material"
  >
    <TresCylinderGeometry :args="cylinderArgs" />
  </TresMesh>
</template>