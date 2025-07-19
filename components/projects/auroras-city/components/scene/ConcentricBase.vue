<script setup lang="ts">
import { shallowRef, onUnmounted, onMounted } from 'vue'
import { DoubleSide, ShaderMaterial, Vector2, Clock } from 'three'
import { useLoop } from '@tresjs/core'

import { createConcentricBase } from '../../utils/geometryUtils'

import sinusoidalTresJS2VertexShader from '../../shaders/sinusoidalTresJS2-vertex.glsl'
import fragmentShader from '../../shaders/fragment.glsl'

interface Props {
  position?: [number, number, number]
  scale?: [number, number, number]
  rotationSpeed?: number
  baseArgs?: [[number, number, number], number, number]// [radii, sinkDepth], sinkDepth cannot exceed outerHeight/2,outerHeight
}

const props = withDefaults(defineProps<Props>(), {
  position: () => [0, 0, 0],
  scale: () => [1, 1, 1],
  rotationSpeed: 0,
  baseArgs: () => [[1.5, 3.0, 4.8], 0.25, 0.75], // [inner radius, middle radius, outer radius], sink depth, outer ring height
})

const material = shallowRef()
const meshRef = shallowRef()
const geometry = shallowRef()
const currentRotation = shallowRef<[number, number, number]>([0, 0, 0])

const clock = new Clock()

const uniforms = {
  iResolution: { value: new Vector2(400, 400) },
  iTime: { value: 0 },
}

const shaderMaterial = new ShaderMaterial({
  vertexShader: sinusoidalTresJS2VertexShader,
  fragmentShader: fragmentShader,
  uniforms,
  side: DoubleSide,
  transparent: true,
  wireframe: false,
})

material.value = shaderMaterial


onMounted(() => {
  clock.start()
  const [radii, sinkDepth, outerHeight] = props.baseArgs

  // Validate sinkDepth doesn't exceed outerHeight/2
  const validSinkDepth = Math.min(sinkDepth, outerHeight / 2)

  geometry.value = createConcentricBase({
    radii,
    sinkDepth: validSinkDepth,
    outerHeight,
    segments: 32
  })
})

const { onBeforeRender } = useLoop()

onBeforeRender(() => {
  const elapsed = clock.getElapsedTime()
  uniforms.iTime.value = elapsed

  if (props.rotationSpeed !== 0) {
    const time = Date.now() * 0.001
    currentRotation.value = [0, time * props.rotationSpeed, 0]
  }
})

onUnmounted(() => {
  if (shaderMaterial) shaderMaterial.dispose()
  if (geometry.value) geometry.value.dispose()
  clock.stop()
})
</script>

<template>
  <TresMesh v-if="geometry" ref="meshRef" :position="position" :scale="scale" :rotation="currentRotation"
    :material="material" :geometry="geometry" />
</template>