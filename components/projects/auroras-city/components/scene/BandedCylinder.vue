<script setup lang="ts">
import { shallowRef, onUnmounted, onMounted } from 'vue'
import { BufferGeometry, BufferAttribute, DoubleSide, ShaderMaterial, Vector2, Clock } from 'three'
import { useLoop } from '@tresjs/core'

import sinusoidalVertexShader from '../../shaders/sinusoidalTresJS-vertex.glsl'
import fragmentShader from '../../shaders/fragment.glsl'

interface Props {
  position?: [number, number, number]
  scale?: [number, number, number]
  rotation?: [number, number, number]
  cylinderArgs?: [number, number, number, number, number] // radius, height, bands, gapRatio, twist
}

const props = withDefaults(defineProps<Props>(), {
  position: () => [0, 0, 0],
  scale: () => [1, 1, 1],
  rotation: () => [0, 0, 0],
  cylinderArgs: () => [0.75, 3.5, 64, 0.45, 0.075], // radius, height, bands, gapRatio, twist
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
  fragmentShader: fragmentShader,
  uniforms,
  side: DoubleSide,
  transparent: true,
  wireframe: false,
})

material.value = shaderMaterial

function createBandedCylinder(radius = 1, height = 3, bands = 6, gapRatio = 0.3, twist = 0) {
  const geo = new BufferGeometry()

  const vertices = []
  const normals = []
  const uvs = []
  const indices = []

  const segmentsPerBand = 3 // Number of segments per band
  const bandAngle = (Math.PI * 2) / bands // Angle occupied by each band
  const activeAngle = bandAngle * (1 - gapRatio) // Actual angle after subtracting the gap

  let vertexIndex = 0

  for (let b = 0; b < bands; b++) {
    const startAngle = b * bandAngle

    for (let i = 0; i <= segmentsPerBand; i++) {
      const baseAngle = startAngle + (i / segmentsPerBand) * activeAngle

      // Bottom vertex
      const bottomY = -height / 2
      const bottomTwist = (bottomY / height) * twist * Math.PI
      const bottomAngle = baseAngle + bottomTwist
      const bottomX = Math.cos(bottomAngle) * radius
      const bottomZ = Math.sin(bottomAngle) * radius

      vertices.push(bottomX, bottomY, bottomZ)
      normals.push(bottomX / radius, 0, bottomZ / radius)
      uvs.push((b + i / segmentsPerBand) / bands, 0)

      // Top vertex
      const topY = height / 2
      const topTwist = (topY / height) * twist * Math.PI
      const topAngle = baseAngle + topTwist
      const topX = Math.cos(topAngle) * radius
      const topZ = Math.sin(topAngle) * radius

      vertices.push(topX, topY, topZ)
      normals.push(topX / radius, 0, topZ / radius)
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