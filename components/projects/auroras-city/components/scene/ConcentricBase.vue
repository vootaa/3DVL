<script setup lang="ts">
import { shallowRef, onUnmounted, onMounted } from 'vue'
import { BufferGeometry, BufferAttribute, DoubleSide, ShaderMaterial, Vector2, Clock } from 'three'
import { useLoop } from '@tresjs/core'

import sinusoidalTresJS2VertexShader from '../../shaders/sinusoidalTresJS2-vertex.glsl'
import fragmentShader from '../../shaders/fragment.glsl'


interface Props {
  position?: [number, number, number]
  scale?: [number, number, number]
  rotationSpeed?: number
  baseArgs?: [number[], number[]] // radii, heights
}

const props = withDefaults(defineProps<Props>(), {
  position: () => [0, 0, 0],
  scale: () => [1, 1, 1],
  rotationSpeed: 0,
  baseArgs: () => [[1.5, 3.0, 4.8], [0.1, 1.0, 1.5]], // [inner radius, middle radius, outer radius], [inner height, middle height, outer height]
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
  wireframe: true,
})

material.value = shaderMaterial

function createConcentricBase(radii: number[], heights: number[]) {
  const geo = new BufferGeometry()
  
  const vertices: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  
  let vertexIndex = 0
  const segments = 32
  
  const [innerRadius, middleRadius, outerRadius] = radii
  const [innerHeight, middleHeight, outerHeight] = heights
  
  // Calculate Y position for each layer (outer to inner sinks down)
  const baseY = 0 // base height
  const outerTop = baseY + outerHeight
  const outerBottom = baseY
  const middleTop = baseY + middleHeight
  const innerTop = baseY + innerHeight
  
  // Helper function to add vertex and face
  function addVertex(x: number, y: number, z: number, nx: number, ny: number, nz: number, u: number, v: number) {
    vertices.push(x, y, z)
    normals.push(nx, ny, nz)
    uvs.push(u, v)
    return vertexIndex++
  }
  
  function addCircle(radius: number, y: number, normalY: number, reverse = false) {
    const centerIndex = addVertex(0, y, 0, 0, normalY, 0, 0.5, 0.5)
    const ringStart = vertexIndex
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      addVertex(x, y, z, 0, normalY, 0, (x / radius + 1) / 2, (z / radius + 1) / 2)
      
      if (i < segments) {
        if (reverse) {
          indices.push(centerIndex, ringStart + i + 1, ringStart + i)
        } else {
          indices.push(centerIndex, ringStart + i, ringStart + i + 1)
        }
      }
    }
    
    return ringStart
  }
  
  function addCylinderSide(radius: number, topY: number, bottomY: number) {
    const topRingStart = vertexIndex
    const bottomRingStart = vertexIndex + segments + 1
    
    // Top ring
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      addVertex(x, topY, z, x / radius, 0, z / radius, i / segments, 1)
    }
    
    // Bottom ring
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      addVertex(x, bottomY, z, x / radius, 0, z / radius, i / segments, 0)
    }
    
    // Side faces
    for (let i = 0; i < segments; i++) {
      const topCurrent = topRingStart + i
      const topNext = topRingStart + (i + 1)
      const bottomCurrent = bottomRingStart + i
      const bottomNext = bottomRingStart + (i + 1)
      
      indices.push(topCurrent, bottomCurrent, topNext)
      indices.push(topNext, bottomCurrent, bottomNext)
    }
  }
  
  function addRing(innerRadius: number, outerRadius: number, y: number, normalY: number, reverse = false) {
    const ringStart = vertexIndex
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      // Inner ring
      const x1 = Math.cos(angle) * innerRadius
      const z1 = Math.sin(angle) * innerRadius
      addVertex(x1, y, z1, 0, normalY, 0, (x1 / outerRadius + 1) / 2, (z1 / outerRadius + 1) / 2)
      // Outer ring
      const x2 = Math.cos(angle) * outerRadius
      const z2 = Math.sin(angle) * outerRadius
      addVertex(x2, y, z2, 0, normalY, 0, (x2 / outerRadius + 1) / 2, (z2 / outerRadius + 1) / 2)
    }
    
    // Ring faces
    for (let i = 0; i < segments; i++) {
      const innerCurrent = ringStart + i * 2
      const innerNext = ringStart + ((i + 1) % (segments + 1)) * 2
      const outerCurrent = innerCurrent + 1
      const outerNext = innerNext + 1
      
      if (reverse) {
        indices.push(innerCurrent, innerNext, outerCurrent)
        indices.push(outerCurrent, innerNext, outerNext)
      } else {
        indices.push(innerCurrent, outerCurrent, innerNext)
        indices.push(innerNext, outerCurrent, outerNext)
      }
    }
  }
  
  // 1. Outer top ring face (from middle to outer radius at outer height) - Fixed: ring instead of full circle
  addRing(middleRadius, outerRadius, outerTop, 1)
  
  // 2. Outer cylinder side (from outer top to outer bottom)
  addCylinderSide(outerRadius, outerTop, outerBottom)
  
  // 3. Ring face from outer to middle (at middle height)
  addRing(middleRadius, outerRadius, middleTop, 1)
  
  // 4. Step side from outer to middle
  addCylinderSide(middleRadius, outerTop, middleTop)
  
  // 5. Ring face from middle to inner (at middle height)
  addRing(innerRadius, middleRadius, middleTop, 1)
  
  // 6. Step side from middle to inner
  addCylinderSide(innerRadius, middleTop, innerTop)
  
  // 7. Inner top face - full circle (from center to inner radius)
  addCircle(innerRadius, innerTop, 1)
  
  // 8. Bottom face (full circle from center to outer radius)
  addCircle(outerRadius, outerBottom, -1, true)
  
  geo.setIndex(indices)
  geo.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
  geo.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
  
  geo.computeVertexNormals()
  
  return geo
}

onMounted(() => {
  clock.start()
  const [radii, heights] = props.baseArgs
  geometry.value = createConcentricBase(radii, heights)
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