<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { BufferGeometry, Float32BufferAttribute, Mesh } from 'three'

const props = defineProps({
  width: { type: Number, default: 120 },
  height: { type: Number, default: 120 },
  segments: { type: Number, default: 120 },
  maxHeight: { type: Number, default: 6 },
  valleyWidth: { type: Number, default: 10 },
  wireColor: { type: String, default: '#44aaff' }
})

const seed = Math.random() * 1000
function valleyCurve(x: number): number {
  return Math.sin(x * 0.08 + seed) * props.height * 0.15
}

function getHeight(x: number, y: number): number {
  const curveY = valleyCurve(x)
  const dist = Math.abs(y - curveY)
  if (dist < props.valleyWidth) {
    return 0
  }
  const t = Math.min((dist - props.valleyWidth) / (props.height * 0.5), 1)
  return t * props.maxHeight
}

// Provide terrain height query method (x, z are world coordinates)
function getTerrainHeight(x: number, z: number): number {
  // Map x/z to terrain coordinates
  return getHeight(x, z)
}
provide('getTerrainHeight', getTerrainHeight)

const geometry = ref<BufferGeometry>()
const meshRef = ref<Mesh>()

function generateVertices() {
  const vertices = []
  for (let i = 0; i <= props.segments; i++) {
    for (let j = 0; j <= props.segments; j++) {
      const x = (i / props.segments - 0.5) * props.width
      const y = (j / props.segments - 0.5) * props.height
      const z = getHeight(x, y)
      vertices.push(x, z, y)
    }
  }
  return new Float32Array(vertices)
}

onMounted(() => {
  geometry.value = new BufferGeometry()
  const vertices = generateVertices()
  geometry.value.setAttribute('position', new Float32BufferAttribute(vertices, 3))

  const indices = []
  for (let i = 0; i < props.segments; i++) {
    for (let j = 0; j < props.segments; j++) {
      const a = i * (props.segments + 1) + j
      const b = a + 1
      const c = a + (props.segments + 1)
      const d = c + 1
      indices.push(a, b, d)
      indices.push(a, d, c)
    }
  }
  geometry.value.setIndex(indices)
  geometry.value.computeVertexNormals()
})
</script>

<template>
  <TresMesh ref="meshRef" :geometry="geometry" :position="[0, 0, 0]" receive-shadow cast-shadow>
    <TresMeshStandardMaterial color="#226688" :wireframe="false" :metalness="0.2" :roughness="0.8" :opacity="0.95" transparent />
    <TresMeshStandardMaterial :wireframe="true" :color="wireColor" :opacity="0.7" transparent />
  </TresMesh>
</template>