<script setup lang="ts">
import { shallowRef, onUnmounted, onMounted } from 'vue'
import { BufferGeometry, BufferAttribute, Material, MeshStandardMaterial } from 'three'
import { useLoop } from '@tresjs/core'

interface Props {
  position?: [number, number, number]
  scale?: [number, number, number]
  rotationSpeed?: number
  baseArgs?: [number[], number[], number, number] // radii, heights, stepCount, segments
  materials?: Material[] // External material array: [inner disk, middle disk, outer disk, connector]
}

const props = withDefaults(defineProps<Props>(), {
  position: () => [0, 0, 0],
  scale: () => [1, 1, 1],
  rotationSpeed: 0,
  baseArgs: () => [[1.5, 3.0, 4.8], [2.0, 1.5, 1.0], 5, 32], // radii, heights, stepCount, segments
  materials: () => [
    new MeshStandardMaterial({ color: 0x888888 }),
    new MeshStandardMaterial({ color: 0x666666 }),
    new MeshStandardMaterial({ color: 0x444444 }),
    new MeshStandardMaterial({ color: 0x999999 })
  ]
})

const meshRef = shallowRef()
const geometry = shallowRef()
const currentRotation = shallowRef<[number, number, number]>([0, 0, 0])

function createConcentricBase(radii: number[], heights: number[], stepCount: number, segments: number) {
  const geo = new BufferGeometry()
  
  const vertices: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const groups: { start: number; count: number; materialIndex: number }[] = []
  
  let vertexIndex = 0
  
  const [innerRadius, middleRadius, outerRadius] = radii
  const [innerHeight, middleHeight, outerHeight] = heights
  
  // Calculate transition zones
  const innerToMiddleGap = middleRadius - innerRadius
  const innerStepZone = innerToMiddleGap * (1/3) // 1/3 for steps
  
  const middleToOuterGap = outerRadius - middleRadius
  const outerStepZone = middleToOuterGap * (1/3) // 1/3 for steps
  
  // Effective radii after considering step zones
  const innerDiskRadius = innerRadius
  const middleDiskInnerRadius = innerRadius + innerStepZone
  const middleDiskOuterRadius = middleRadius
  const outerDiskInnerRadius = middleRadius + outerStepZone
  const outerDiskOuterRadius = outerRadius
  
  // Calculate height levels
  const innerTop = innerHeight / 2
  const innerBottom = -innerHeight / 2
  const middleTop = middleHeight / 2
  const middleBottom = -middleHeight / 2
  const outerTop = outerHeight / 2
  const outerBottom = -outerHeight / 2
  
  // Step height calculations
  const innerToMiddleStepHeight = (innerBottom - middleTop) / stepCount
  const middleToOuterStepHeight = (middleBottom - outerTop) / stepCount
  
  // 1. Create top surface (inner disk)
  const topSurfaceStart = indices.length
  const topCenterIndex = vertexIndex
  vertices.push(0, innerTop, 0)
  normals.push(0, 1, 0)
  uvs.push(0.5, 0.5)
  vertexIndex++
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * innerDiskRadius
    const z = Math.sin(angle) * innerDiskRadius
    
    vertices.push(x, innerTop, z)
    normals.push(0, 1, 0)
    uvs.push((x / innerDiskRadius + 1) / 2, (z / innerDiskRadius + 1) / 2)
    
    if (i < segments) {
      indices.push(topCenterIndex, vertexIndex, vertexIndex + 1)
    }
    vertexIndex++
  }
  
  groups.push({
    start: topSurfaceStart,
    count: indices.length - topSurfaceStart,
    materialIndex: 0 // Inner disk material
  })
  
  // 2. Create inner disk side surface
  const innerSideStart = indices.length
  const innerTopRingStart = vertexIndex
  const innerBottomRingStart = vertexIndex + segments + 1
  
  // Inner disk top ring
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * innerDiskRadius
    const z = Math.sin(angle) * innerDiskRadius
    
    vertices.push(x, innerTop, z)
    normals.push(x / innerDiskRadius, 0, z / innerDiskRadius)
    uvs.push(i / segments, 1)
    vertexIndex++
  }
  
  // Inner disk bottom ring
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * innerDiskRadius
    const z = Math.sin(angle) * innerDiskRadius
    
    vertices.push(x, innerBottom, z)
    normals.push(x / innerDiskRadius, 0, z / innerDiskRadius)
    uvs.push(i / segments, 0)
    vertexIndex++
  }
  
  // Create inner disk side faces
  for (let i = 0; i < segments; i++) {
    const topCurrent = innerTopRingStart + i
    const topNext = innerTopRingStart + (i + 1)
    const bottomCurrent = innerBottomRingStart + i
    const bottomNext = innerBottomRingStart + (i + 1)
    
    indices.push(topCurrent, bottomCurrent, topNext)
    indices.push(topNext, bottomCurrent, bottomNext)
  }
  
  groups.push({
    start: innerSideStart,
    count: indices.length - innerSideStart,
    materialIndex: 0 // Inner disk material
  })
  
  // 3. Create middle disk top surface (ring shape)
  const middleDiskStart = indices.length
  
  // Create ring surface between middleDiskInnerRadius and middleDiskOuterRadius
  const middleRingSegments = 8 // Number of radial segments for the ring
  for (let r = 0; r < middleRingSegments; r++) {
    const r1 = middleDiskInnerRadius + (r / middleRingSegments) * (middleDiskOuterRadius - middleDiskInnerRadius)
    const r2 = middleDiskInnerRadius + ((r + 1) / middleRingSegments) * (middleDiskOuterRadius - middleDiskInnerRadius)
    
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2
      const angle2 = ((i + 1) / segments) * Math.PI * 2
      
      // Four vertices of the quad
      const x1_1 = Math.cos(angle1) * r1
      const z1_1 = Math.sin(angle1) * r1
      const x1_2 = Math.cos(angle2) * r1
      const z1_2 = Math.sin(angle2) * r1
      const x2_1 = Math.cos(angle1) * r2
      const z2_1 = Math.sin(angle1) * r2
      const x2_2 = Math.cos(angle2) * r2
      const z2_2 = Math.sin(angle2) * r2
      
      const baseVertex = vertexIndex
      
      vertices.push(x1_1, middleTop, z1_1)
      vertices.push(x1_2, middleTop, z1_2)
      vertices.push(x2_1, middleTop, z2_1)
      vertices.push(x2_2, middleTop, z2_2)
      
      normals.push(0, 1, 0)
      normals.push(0, 1, 0)
      normals.push(0, 1, 0)
      normals.push(0, 1, 0)
      
      uvs.push((x1_1 / middleDiskOuterRadius + 1) / 2, (z1_1 / middleDiskOuterRadius + 1) / 2)
      uvs.push((x1_2 / middleDiskOuterRadius + 1) / 2, (z1_2 / middleDiskOuterRadius + 1) / 2)
      uvs.push((x2_1 / middleDiskOuterRadius + 1) / 2, (z2_1 / middleDiskOuterRadius + 1) / 2)
      uvs.push((x2_2 / middleDiskOuterRadius + 1) / 2, (z2_2 / middleDiskOuterRadius + 1) / 2)
      
      indices.push(baseVertex, baseVertex + 2, baseVertex + 1)
      indices.push(baseVertex + 1, baseVertex + 2, baseVertex + 3)
      
      vertexIndex += 4
    }
  }
  
  groups.push({
    start: middleDiskStart,
    count: indices.length - middleDiskStart,
    materialIndex: 1 // Middle disk material
  })
  
  // 4. Create outer disk bottom surface (ring shape)
  const outerDiskStart = indices.length
  
  // Create ring surface between outerDiskInnerRadius and outerDiskOuterRadius
  const outerRingSegments = 8
  for (let r = 0; r < outerRingSegments; r++) {
    const r1 = outerDiskInnerRadius + (r / outerRingSegments) * (outerDiskOuterRadius - outerDiskInnerRadius)
    const r2 = outerDiskInnerRadius + ((r + 1) / outerRingSegments) * (outerDiskOuterRadius - outerDiskInnerRadius)
    
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2
      const angle2 = ((i + 1) / segments) * Math.PI * 2
      
      const x1_1 = Math.cos(angle1) * r1
      const z1_1 = Math.sin(angle1) * r1
      const x1_2 = Math.cos(angle2) * r1
      const z1_2 = Math.sin(angle2) * r1
      const x2_1 = Math.cos(angle1) * r2
      const z2_1 = Math.sin(angle1) * r2
      const x2_2 = Math.cos(angle2) * r2
      const z2_2 = Math.sin(angle2) * r2
      
      const baseVertex = vertexIndex
      
      vertices.push(x1_1, outerTop, z1_1)
      vertices.push(x1_2, outerTop, z1_2)
      vertices.push(x2_1, outerTop, z2_1)
      vertices.push(x2_2, outerTop, z2_2)
      
      normals.push(0, 1, 0)
      normals.push(0, 1, 0)
      normals.push(0, 1, 0)
      normals.push(0, 1, 0)
      
      uvs.push((x1_1 / outerDiskOuterRadius + 1) / 2, (z1_1 / outerDiskOuterRadius + 1) / 2)
      uvs.push((x1_2 / outerDiskOuterRadius + 1) / 2, (z1_2 / outerDiskOuterRadius + 1) / 2)
      uvs.push((x2_1 / outerDiskOuterRadius + 1) / 2, (z2_1 / outerDiskOuterRadius + 1) / 2)
      uvs.push((x2_2 / outerDiskOuterRadius + 1) / 2, (z2_2 / outerDiskOuterRadius + 1) / 2)
      
      // Note: reverse winding for bottom surface
      indices.push(baseVertex, baseVertex + 1, baseVertex + 2)
      indices.push(baseVertex + 1, baseVertex + 3, baseVertex + 2)
      
      vertexIndex += 4
    }
  }
  
  groups.push({
    start: outerDiskStart,
    count: indices.length - outerDiskStart,
    materialIndex: 2 // Outer disk material
  })
  
  // 5. Create bottom surface (full outer disk)
  const bottomSurfaceStart = indices.length
  const bottomCenterIndex = vertexIndex
  vertices.push(0, outerBottom, 0)
  normals.push(0, -1, 0)
  uvs.push(0.5, 0.5)
  vertexIndex++
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * outerDiskOuterRadius
    const z = Math.sin(angle) * outerDiskOuterRadius
    
    vertices.push(x, outerBottom, z)
    normals.push(0, -1, 0)
    uvs.push((x / outerDiskOuterRadius + 1) / 2, (z / outerDiskOuterRadius + 1) / 2)
    
    if (i < segments) {
      indices.push(bottomCenterIndex, vertexIndex + 1, vertexIndex)
    }
    vertexIndex++
  }
  
  groups.push({
    start: bottomSurfaceStart,
    count: indices.length - bottomSurfaceStart,
    materialIndex: 2 // Outer disk material
  })
  
  // 6. Create outer side surface
  const outerSideStart = indices.length
  const outerTopRingStart = vertexIndex
  const outerBottomRingStart = vertexIndex + segments + 1
  
  // Outer top ring
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * outerDiskOuterRadius
    const z = Math.sin(angle) * outerDiskOuterRadius
    
    vertices.push(x, outerTop, z)
    normals.push(x / outerDiskOuterRadius, 0, z / outerDiskOuterRadius)
    uvs.push(i / segments, 1)
    vertexIndex++
  }
  
  // Outer bottom ring
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const x = Math.cos(angle) * outerDiskOuterRadius
    const z = Math.sin(angle) * outerDiskOuterRadius
    
    vertices.push(x, outerBottom, z)
    normals.push(x / outerDiskOuterRadius, 0, z / outerDiskOuterRadius)
    uvs.push(i / segments, 0)
    vertexIndex++
  }
  
  // Create outer side faces
  for (let i = 0; i < segments; i++) {
    const topCurrent = outerTopRingStart + i
    const topNext = outerTopRingStart + (i + 1)
    const bottomCurrent = outerBottomRingStart + i
    const bottomNext = outerBottomRingStart + (i + 1)
    
    indices.push(topCurrent, bottomCurrent, topNext)
    indices.push(topNext, bottomCurrent, bottomNext)
  }
  
  groups.push({
    start: outerSideStart,
    count: indices.length - outerSideStart,
    materialIndex: 2 // Outer disk material
  })
  
  // 7. Create inner to middle stepped transitions
  const innerToMiddleStepsStart = indices.length
  
  for (let step = 0; step < stepCount; step++) {
    const t = step / stepCount
    const radius = innerDiskRadius + t * innerStepZone
    const stepTop = innerBottom - step * innerToMiddleStepHeight
    const stepBottom = innerBottom - (step + 1) * innerToMiddleStepHeight
    
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2
      const angle2 = ((i + 1) / segments) * Math.PI * 2
      
      const x1 = Math.cos(angle1) * radius
      const z1 = Math.sin(angle1) * radius
      const x2 = Math.cos(angle2) * radius
      const z2 = Math.sin(angle2) * radius
      
      const baseVertex = vertexIndex
      
      // Step top surface
      vertices.push(x1, stepTop, z1)
      vertices.push(x2, stepTop, z2)
      // Step side surface (vertical)
      vertices.push(x1, stepBottom, z1)
      vertices.push(x2, stepBottom, z2)
      
      normals.push(0, 1, 0) // Top surface normal
      normals.push(0, 1, 0)
      normals.push(x1 / radius, 0, z1 / radius) // Side surface normal
      normals.push(x2 / radius, 0, z2 / radius)
      
      uvs.push(i / segments, 0)
      uvs.push((i + 1) / segments, 0)
      uvs.push(i / segments, 1)
      uvs.push((i + 1) / segments, 1)
      
      // Top surface triangle
      if (step === 0) {
        indices.push(baseVertex, baseVertex + 2, baseVertex + 1)
        indices.push(baseVertex + 1, baseVertex + 2, baseVertex + 3)
      }
      
      // Side surface
      indices.push(baseVertex, baseVertex + 1, baseVertex + 2)
      indices.push(baseVertex + 1, baseVertex + 3, baseVertex + 2)
      
      vertexIndex += 4
    }
  }
  
  groups.push({
    start: innerToMiddleStepsStart,
    count: indices.length - innerToMiddleStepsStart,
    materialIndex: 3 // Step connector material
  })
  
  // 8. Create middle to outer stepped transitions
  const middleToOuterStepsStart = indices.length
  
  for (let step = 0; step < stepCount; step++) {
    const t = step / stepCount
    const radius = middleDiskOuterRadius + t * outerStepZone
    const stepTop = middleBottom - step * middleToOuterStepHeight
    const stepBottom = middleBottom - (step + 1) * middleToOuterStepHeight
    
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2
      const angle2 = ((i + 1) / segments) * Math.PI * 2
      
      const x1 = Math.cos(angle1) * radius
      const z1 = Math.sin(angle1) * radius
      const x2 = Math.cos(angle2) * radius
      const z2 = Math.sin(angle2) * radius
      
      const baseVertex = vertexIndex
      
      vertices.push(x1, stepTop, z1)
      vertices.push(x2, stepTop, z2)
      vertices.push(x1, stepBottom, z1)
      vertices.push(x2, stepBottom, z2)
      
      normals.push(0, 1, 0)
      normals.push(0, 1, 0)
      normals.push(x1 / radius, 0, z1 / radius)
      normals.push(x2 / radius, 0, z2 / radius)
      
      uvs.push(i / segments, 0)
      uvs.push((i + 1) / segments, 0)
      uvs.push(i / segments, 1)
      uvs.push((i + 1) / segments, 1)
      
      // Top surface
      if (step === 0) {
        indices.push(baseVertex, baseVertex + 2, baseVertex + 1)
        indices.push(baseVertex + 1, baseVertex + 2, baseVertex + 3)
      }
      
      // Side surface
      indices.push(baseVertex, baseVertex + 1, baseVertex + 2)
      indices.push(baseVertex + 1, baseVertex + 3, baseVertex + 2)
      
      vertexIndex += 4
    }
  }
  
  groups.push({
    start: middleToOuterStepsStart,
    count: indices.length - middleToOuterStepsStart,
    materialIndex: 3 // Step connector material
  })
  
  geo.setIndex(indices)
  geo.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
  geo.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
  
  // Set material groups
  groups.forEach(group => {
    geo.addGroup(group.start, group.count, group.materialIndex)
  })
  
  geo.computeVertexNormals()
  
  return geo
}

onMounted(() => {
  const [radii, heights, stepCount, segments] = props.baseArgs
  geometry.value = createConcentricBase(radii, heights, stepCount, segments)
})

const { onBeforeRender } = useLoop()

onBeforeRender(() => {
  if (props.rotationSpeed !== 0) {
    const time = Date.now() * 0.001
    currentRotation.value = [0, time * props.rotationSpeed, 0]
  }
})

onUnmounted(() => {
  if (geometry.value) geometry.value.dispose()
  if (props.materials) {
    props.materials.forEach(material => {
      if (material && typeof material.dispose === 'function') {
        material.dispose()
      }
    })
  }
})
</script>

<template>
  <TresMesh 
    v-if="geometry" 
    ref="meshRef" 
    :position="position" 
    :scale="scale" 
    :rotation="currentRotation"
    :material="materials" 
    :geometry="geometry" 
  />
</template>