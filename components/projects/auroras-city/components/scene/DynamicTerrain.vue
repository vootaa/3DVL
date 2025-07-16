<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { BufferGeometry, Float32BufferAttribute, Mesh } from 'three'

const props = defineProps({
  width: { type: Number, default: 120 },
  height: { type: Number, default: 120 },
  segments: { type: Number, default: 120 },
  maxHeight: { type: Number, default: 6 }
})

// Random seed
const seed = Math.random() * 1000

function perlin(x: number, y: number): number {
    // Use the initialized seed to ensure each mount is different, but remains unchanged afterwards
    return Math.sin(x * 0.15 + seed) * Math.cos(y * 0.15 + seed * 0.5)
}

const geometry = ref<BufferGeometry>()
const meshRef = ref<Mesh>()

function generateVertices() {
  const vertices = []
  for (let i = 0; i <= props.segments; i++) {
    for (let j = 0; j <= props.segments; j++) {
      const x = (i / props.segments - 0.5) * props.width
      const y = (j / props.segments - 0.5) * props.height
      const z = perlin(x, y) * props.maxHeight
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
    <TresMeshStandardMaterial color="#226688" :wireframe="false" :metalness="0.2" :roughness="0.8" :opacity="0.95"
      transparent />
  </TresMesh>
</template>