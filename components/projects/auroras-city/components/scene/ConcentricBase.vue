<script setup lang="ts">
import { shallowRef, onUnmounted, onMounted } from 'vue'
import { ShaderMaterial, Clock } from 'three'
import { useLoop } from '@tresjs/core'

import { createConcentricBase } from '../../utils/geometryUtils'
import { concentricBaseVertexShader, concentricBaseFragmentShader } from '../../shaders/concentric-base-shader'

interface Props {
  position?: [number, number, number]
  scale?: [number, number, number]
  rotationSpeed?: number
  baseArgs?: [[number, number, number], number, number] // [radii, sinkDepth], sinkDepth cannot exceed outerHeight/2,outerHeight
}

const props = withDefaults(defineProps<Props>(), {
  position: () => [0, 0, 0],
  scale: () => [1, 1, 1],
  rotationSpeed: 0,
  baseArgs: () => [[1.5, 3.0, 4.8], 0.4, 1.0], // [inner radius, middle radius, outer radius], sink depth, outer ring height
})

const material = shallowRef()
const meshRef = shallowRef()
const geometry = shallowRef()
const currentRotation = shallowRef<[number, number, number]>([0, 0, 0])

const clock = new Clock()

const uniforms = {
  uTime: { value: 0 },
}

onMounted(() => {
  clock.start()

  const [radii, sinkDepth, outerHeight] = props.baseArgs
  const validSinkDepth = Math.min(sinkDepth, outerHeight / 2)

  geometry.value = createConcentricBase({
    radii,
    sinkDepth: validSinkDepth,
    outerHeight,
    segments: 32
  })

  material.value = new ShaderMaterial({
    vertexShader: concentricBaseVertexShader,
    fragmentShader: concentricBaseFragmentShader,
    uniforms,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    side: 2, // DoubleSide
  })
})

const { onBeforeRender } = useLoop()

onBeforeRender(() => {
  const elapsed = clock.getElapsedTime()
  uniforms.uTime.value = elapsed

  if (props.rotationSpeed !== 0) {
    const time = Date.now() * 0.001
    currentRotation.value = [0, time * props.rotationSpeed, 0]
  }
})

onUnmounted(() => {
  if (material.value) material.value.dispose()
  if (geometry.value) geometry.value.dispose()
  clock.stop()
})
</script>

<template>
  <TresMesh v-if="geometry && material" ref="meshRef" :position="position" :scale="scale" :rotation="currentRotation"
    :material="material" :geometry="geometry" />
</template>