<script setup lang="ts">
import { shallowRef, onUnmounted, onMounted } from 'vue'
import { BufferGeometry, BufferAttribute, MeshStandardMaterial } from 'three'
import { useLoop } from '@tresjs/core'

interface Props {
  position?: [number, number, number]
  scale?: [number, number, number]
  rotationSpeed?: number
  baseArgs?: [number[], number[]] // radii, heights
  material?: MeshStandardMaterial
}

const props = withDefaults(defineProps<Props>(), {
  position: () => [0, 0, 0],
  scale: () => [1, 1, 1],
  rotationSpeed: 0,
  baseArgs: () => [[1.5, 3.0, 4.8], [0.25, 1.0, 1.5]], // [内层半径, 中层半径, 外层半径], [内层高度, 中层高度, 外层高度]
  material: () => new MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.2, wireframe: false })
})

const meshRef = shallowRef()
const geometry = shallowRef()
const currentRotation = shallowRef<[number, number, number]>([0, 0, 0])

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
  
  // 计算每层的Y位置（从外到内下沉）
  const baseY = 0 // 基准高度
  const outerTop = baseY + outerHeight
  const outerBottom = baseY
  const middleTop = baseY + middleHeight
  const innerTop = baseY + innerHeight
  
  // 添加顶点和面的辅助函数
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
    
    // 顶部环
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      addVertex(x, topY, z, x / radius, 0, z / radius, i / segments, 1)
    }
    
    // 底部环
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      addVertex(x, bottomY, z, x / radius, 0, z / radius, i / segments, 0)
    }
    
    // 侧面
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
      // 内环
      const x1 = Math.cos(angle) * innerRadius
      const z1 = Math.sin(angle) * innerRadius
      addVertex(x1, y, z1, 0, normalY, 0, (x1 / outerRadius + 1) / 2, (z1 / outerRadius + 1) / 2)
      // 外环
      const x2 = Math.cos(angle) * outerRadius
      const z2 = Math.sin(angle) * outerRadius
      addVertex(x2, y, z2, 0, normalY, 0, (x2 / outerRadius + 1) / 2, (z2 / outerRadius + 1) / 2)
    }
    
    // 环形面
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
  
  // 1. 外层圆柱体 - 最高
  addCircle(outerRadius, outerTop, 1) // 外层顶面
  addCylinderSide(outerRadius, outerTop, outerBottom) // 外层侧面
  
  // 2. 外层到中层的环形面（在中层高度）
  addRing(middleRadius, outerRadius, middleTop, 1)
  
  // 3. 外层到中层的连接面（阶梯侧面）
  addCylinderSide(middleRadius, outerTop, middleTop)
  
  // 4. 中层到内层的环形面（在中层高度，不是内层高度！）
  addRing(innerRadius, middleRadius, middleTop, 1)
  
  // 5. 中层到内层的连接面（阶梯侧面）
  addCylinderSide(innerRadius, middleTop, innerTop)
  
  // 6. 内层顶面 - 最低
  addCircle(innerRadius, innerTop, 1)
  
  // 7. 底面（整个基座的底部）
  addCircle(outerRadius, outerBottom, -1, true)
  
  geo.setIndex(indices)
  geo.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
  geo.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2))
  
  geo.computeVertexNormals()
  
  return geo
}

onMounted(() => {
  const [radii, heights] = props.baseArgs
  geometry.value = createConcentricBase(radii, heights)
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
  if (props.material) props.material.dispose()
})
</script>

<template>
  <TresMesh 
    v-if="geometry" 
    ref="meshRef" 
    :position="position" 
    :scale="scale" 
    :rotation="currentRotation"
    :material="material" 
    :geometry="geometry" 
  />
</template>