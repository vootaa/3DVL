<script setup lang="ts">
import { shallowRef, onUnmounted, onMounted } from 'vue'
import { BufferGeometry, BufferAttribute, DoubleSide, ShaderMaterial, Vector2, Clock } from 'three'
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
  cylinderArgs: () => [0.75, 3.5, 25, 0.5], // radius, height, bands, gapRatio
})

const material = shallowRef()
const meshRef = shallowRef()
const geometry = shallowRef()

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

function createBandedCylinder(radius = 1, height = 3, bands = 6, gapRatio = 0.3) {
  const geo = new BufferGeometry()

  const vertices = []
  const normals = []
  const uvs = []
  const indices = []

  const segmentsPerBand = 32 // Number of segments per band
  const bandAngle = (Math.PI * 2) / bands // Angle occupied by each band
  const activeAngle = bandAngle * (1 - gapRatio) // Actual angle after subtracting the gap

  let vertexIndex = 0

  for (let b = 0; b < bands; b++) {
    const startAngle = b * bandAngle

    for (let i = 0; i <= segmentsPerBand; i++) {
      const angle = startAngle + (i / segmentsPerBand) * activeAngle
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      // Bottom vertex
      vertices.push(x, -height / 2, z)
      normals.push(x / radius, 0, z / radius)
      uvs.push((b + i / segmentsPerBand) / bands, 0)

      // Top vertex
      vertices.push(x, height / 2, z)
      normals.push(x / radius, 0, z / radius)
      uvs.push((b + i / segmentsPerBand) / bands, 1)

      // Add face indices (two triangles form a rectangle)
      if (i < segmentsPerBand) {
        const a = vertexIndex * 2
        const b = a + 1
        const c = a + 2
        const d = a + 3

        // First triangle
        indices.push(a, c, b)
        // Second triangle
        indices.push(b, c, d)
      }

      vertexIndex++
    }
  }

  geo.setIndex(indices)
  geo.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
  geo.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))

  console.log(`Created banded cylinder: ${bands} bands, ${vertices.length/3} vertices, ${indices.length/3} faces`)

  return geo
}

onMounted(() => {
  clock.start()
  geometry.value = createBandedCylinder(...props.cylinderArgs)
})

const { onBeforeRender } = useLoop()

onBeforeRender(() => {
  uniforms.iTime.value = clock.getElapsedTime()
})

onUnmounted(() => {
  if (shaderMaterial) shaderMaterial.dispose()
  if (geometry.value) geometry.value.dispose()
  clock.stop()
})
</script>

<template>
  <TresMesh 
    v-if="geometry"
    ref="meshRef" 
    :position="position" 
    :scale="scale" 
    :rotation="rotation" 
    :material="material"
    :geometry="geometry"
  />
</template>