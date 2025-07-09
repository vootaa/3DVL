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
  cylinderArgs: () => [1, 5, 20, 0.8], // radius, height, bands, gapRatio
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

  const segmentsPerBand = 32 // 每个带的分段数
  const bandAngle = (Math.PI * 2) / bands // 每个带占用的角度
  const activeAngle = bandAngle * (1 - gapRatio) // 减去间隙后的实际角度

  let vertexIndex = 0

  for (let b = 0; b < bands; b++) {
    const startAngle = b * bandAngle

    for (let i = 0; i <= segmentsPerBand; i++) {
      const angle = startAngle + (i / segmentsPerBand) * activeAngle
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      // 底部顶点
      vertices.push(x, -height / 2, z)
      normals.push(x / radius, 0, z / radius)
      uvs.push((b + i / segmentsPerBand) / bands, 0)

      // 顶部顶点
      vertices.push(x, height / 2, z)
      normals.push(x / radius, 0, z / radius)
      uvs.push((b + i / segmentsPerBand) / bands, 1)

      // 添加面索引 (两个三角形组成一个矩形)
      if (i < segmentsPerBand) {
        const a = vertexIndex * 2
        const b = a + 1
        const c = a + 2
        const d = a + 3

        // 第一个三角形
        indices.push(a, c, b)
        // 第二个三角形
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
  // 创建自定义几何体
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