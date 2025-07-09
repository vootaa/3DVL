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
  
  // Calculate Y position for each layer
  const baseY = 0
  const outerTop = baseY + outerHeight
  const outerBottom = baseY
  const middleTop = baseY + middleHeight
  const innerTop = baseY + innerHeight
  
  // Helper function to add vertex
  function addVertex(x: number, y: number, z: number, nx: number, ny: number, nz: number, u: number, v: number) {
    vertices.push(x, y, z)
    normals.push(nx, ny, nz)
    uvs.push(u, v)
    return vertexIndex++
  }
  
  // Store vertex indices for different rings at different heights
  const rings = {
    outerTop: [] as number[],
    outerBottom: [] as number[],
    middleTop: [] as number[],
    middleBottom: [] as number[],
    innerTop: [] as number[],
    innerBottom: [] as number[]
  }
  
  // Create all ring vertices first
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    
    // Outer ring at top
    const outerX = Math.cos(angle) * outerRadius
    const outerZ = Math.sin(angle) * outerRadius
    rings.outerTop.push(addVertex(outerX, outerTop, outerZ, 0, 1, 0, (outerX / outerRadius + 1) / 2, (outerZ / outerRadius + 1) / 2))
    
    // Outer ring at bottom
    rings.outerBottom.push(addVertex(outerX, outerBottom, outerZ, 0, -1, 0, (outerX / outerRadius + 1) / 2, (outerZ / outerRadius + 1) / 2))
    
    // Middle ring at top (outer level)
    const middleX = Math.cos(angle) * middleRadius
    const middleZ = Math.sin(angle) * middleRadius
    rings.middleTop.push(addVertex(middleX, outerTop, middleZ, 0, 1, 0, (middleX / outerRadius + 1) / 2, (middleZ / outerRadius + 1) / 2))
    
    // Middle ring at middle level
    rings.middleBottom.push(addVertex(middleX, middleTop, middleZ, 0, 1, 0, (middleX / outerRadius + 1) / 2, (middleZ / outerRadius + 1) / 2))
    
    // Inner ring at middle level
    const innerX = Math.cos(angle) * innerRadius
    const innerZ = Math.sin(angle) * innerRadius
    rings.innerTop.push(addVertex(innerX, middleTop, innerZ, 0, 1, 0, (innerX / outerRadius + 1) / 2, (innerZ / outerRadius + 1) / 2))
    
    // Inner ring at inner level
    rings.innerBottom.push(addVertex(innerX, innerTop, innerZ, 0, 1, 0, (innerX / outerRadius + 1) / 2, (innerZ / outerRadius + 1) / 2))
  }
  
  // Add center vertices for circles
  const centerBottom = addVertex(0, outerBottom, 0, 0, -1, 0, 0.5, 0.5)
  const centerInnerTop = addVertex(0, innerTop, 0, 0, 1, 0, 0.5, 0.5)
  
  // Create faces
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % (segments + 1)
    
    // 1. Outer top ring face (middle to outer radius at outer height)
    indices.push(rings.middleTop[i], rings.outerTop[i], rings.middleTop[next])
    indices.push(rings.middleTop[next], rings.outerTop[i], rings.outerTop[next])
    
    // 2. Outer cylinder side (outer radius from top to bottom)
    indices.push(rings.outerTop[i], rings.outerBottom[i], rings.outerTop[next])
    indices.push(rings.outerTop[next], rings.outerBottom[i], rings.outerBottom[next])
    
    // 3. Middle step side (middle radius from outer to middle height)
    indices.push(rings.middleTop[i], rings.middleBottom[next], rings.middleTop[next])
    indices.push(rings.middleTop[i], rings.middleBottom[i], rings.middleBottom[next])
    
    // 4. Middle ring face (inner to middle radius at middle height)
    indices.push(rings.innerTop[i], rings.middleBottom[i], rings.innerTop[next])
    indices.push(rings.innerTop[next], rings.middleBottom[i], rings.middleBottom[next])
    
    // 5. Inner step side (inner radius from middle to inner height)
    indices.push(rings.innerTop[i], rings.innerBottom[next], rings.innerTop[next])
    indices.push(rings.innerTop[i], rings.innerBottom[i], rings.innerBottom[next])
    
    // 6. Inner top face (center to inner radius)
    indices.push(centerInnerTop, rings.innerBottom[i], rings.innerBottom[next])
    
    // 7. Bottom face (center to outer radius)
    indices.push(centerBottom, rings.outerBottom[next], rings.outerBottom[i])
  }
  
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