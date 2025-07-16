<script setup lang="ts">
import { BufferAttribute, BufferGeometry } from 'three'
import { ref, onMounted, inject } from 'vue'

import type { Ref } from 'vue'
import type { PerspectiveCamera } from 'three'

interface Props {
  count?: number
  radius?: number
}

const props = withDefaults(defineProps<Props>(), { count: 500, radius: 6000 })

const positions = new Float32Array(props.count * 3)
const colors = new Float32Array(props.count * 3)

// Preset several common star colors (white, light blue, light yellow, light orange)
const starColors = [
  [1.0, 1.0, 1.0],      // pure white
  [0.87, 0.93, 1.0],    // light blue (#DDEEFF)
  [1.0, 0.96, 0.87],    // light yellow (#FFEEDD)
  [1.0, 0.92, 0.80],    // light orange (#FFDDB3)
]

for (let i = 0; i < props.count; i++) {
  const r = props.radius * (1 + 0.5 * Math.random())
  const theta = 2 * Math.PI * Math.random()
  const phi = Math.acos(2 * Math.random() - 1)
  const x = r * Math.cos(theta) * Math.sin(phi) + (-2000 + Math.random() * 4000)
  const y = r * Math.sin(theta) * Math.sin(phi) + (-2000 + Math.random() * 4000)
  const z = r * Math.cos(phi) + (-1000 + Math.random() * 2000)
  positions[i * 3 + 0] = x
  positions[i * 3 + 1] = y
  positions[i * 3 + 2] = z

  // Randomly select a star color
  const color = starColors[Math.floor(Math.random() * starColors.length)]
  colors[i * 3 + 0] = color[0]
  colors[i * 3 + 1] = color[1]
  colors[i * 3 + 2] = color[2]
}

const geom = new BufferGeometry()
geom.setAttribute('position', new BufferAttribute(positions, 3))
geom.setAttribute('color', new BufferAttribute(colors, 3))


const cameraRef = inject('camera') as Ref<PerspectiveCamera | undefined>
const starsPosition = ref<[number, number, number]>([0, 0, 0])

function updateStarsPosition() {
  if (cameraRef?.value) {
    const pos = cameraRef.value.position
    starsPosition.value = [pos.x, pos.y, pos.z]
  }
  requestAnimationFrame(updateStarsPosition)
}

onMounted(() => {
  updateStarsPosition()
})
</script>

<template>
  <TresPoints :args="[geom]" :position="starsPosition">
    <TresBufferGeometry :position="[positions, 3]" :color="[colors, 3]" />
    <TresPointsMaterial vertexColors :size="15" :size-attenuation="true" :fog="false" />
  </TresPoints>
</template>
