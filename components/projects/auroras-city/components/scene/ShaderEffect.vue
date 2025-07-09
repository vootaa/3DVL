<script setup lang="ts">
import { shallowRef, onUnmounted, onMounted } from 'vue'
import { DoubleSide, ShaderMaterial, Vector2, Clock } from 'three'
import { useLoop } from '@tresjs/core'

import sinusoidalVertexShader from '../../shaders/sinusoidalTresJS-vertex.glsl'
import sinusoidalFragmentShader from '../../shaders/fragment.glsl'

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
  cylinderArgs: () => [1, 2, 2, 2],
})

const material = shallowRef()
const meshRef = shallowRef()

const clock = new Clock()

const uniforms = {
  iResolution: { value: new Vector2(100, 100) },
  iTime: { value: 0 },
}

const shaderMaterial = new ShaderMaterial({
  vertexShader: sinusoidalVertexShader,
  fragmentShader: sinusoidalFragmentShader,
  uniforms,
  side: DoubleSide,
  transparent: true,
  wireframe: false,
})

material.value = shaderMaterial

onMounted(() => {
  clock.start()
})

const { onBeforeRender } = useLoop()

onBeforeRender(() => {
  uniforms.iTime.value = clock.getElapsedTime()
})

onUnmounted(() => {
  if (shaderMaterial) shaderMaterial.dispose()
  clock.stop()
})
</script>

<template>
  <TresMesh ref="meshRef" :position="position" :scale="scale" :rotation="rotation" :material="material">
    <TresCylinderGeometry :args="cylinderArgs" />
  </TresMesh>
</template>