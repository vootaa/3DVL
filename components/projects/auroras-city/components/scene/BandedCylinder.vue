<script setup lang="ts">
import { shallowRef, onUnmounted, onMounted } from 'vue'
import { BufferGeometry, BufferAttribute, DoubleSide, ShaderMaterial, Vector2, Clock } from 'three'
import { useLoop } from '@tresjs/core'

import sinusoidalTresJSVertexShader from '../../shaders/sinusoidalTresJS-vertex.glsl'
import fragmentShader from '../../shaders/fragment.glsl'

interface Props {
  position?: [number, number, number]
  scale?: [number, number, number]
  rotationSpeed?: number
  cylinderArgs?: [number, number, number, number, number] // radius, height, bands, gapRatio, twist
}

const props = withDefaults(defineProps<Props>(), {
  position: () => [0, 0, 0],
  scale: () => [1, 1, 1],
  rotationSpeed: 0.5,
  cylinderArgs: () => [0.75, 3.5, 64, 0.45, -0.1], // radius, height, bands, gapRatio, twist
})

const material = shallowRef()
const meshRef = shallowRef()
const geometry = shallowRef()

const clock = new Clock()

const currentRotation = shallowRef<[number, number, number]>([0, 0, 0])

const uniforms = {
  iResolution: { value: new Vector2(400, 400) },
  iTime: { value: 0 },
}

const shaderMaterial = new ShaderMaterial({
  vertexShader: sinusoidalTresJSVertexShader,
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

  const segmentsPerBand = 3
  const bandAngle = (Math.PI * 2) / bands
  const activeAngle = bandAngle * (1 - gapRatio)

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

      if (i < segmentsPerBand) {
        const a = vertexIndex * 2
        const b = a + 1
        const c = a + 2
        const d = a + 3

        indices.push(a, c, b)
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
  const elapsed = clock.getElapsedTime()
  uniforms.iTime.value = elapsed

  currentRotation.value = [0, elapsed * props.rotationSpeed, 0]
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