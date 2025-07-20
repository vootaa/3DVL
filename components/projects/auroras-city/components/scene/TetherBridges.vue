<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue'
import { Vector3, BufferAttribute, BufferGeometry } from 'three'

import type { SceneConfig } from '../../config/scene-config'
import { petersenNodes, petersenConnections, polarToCartesian } from '../../config/scene-config'
import { tetherBridgeVertexShader, tetherBridgeFragmentShader } from '../../shaders/tether-bridge-shader'

interface Bridge {
  geometry: BufferGeometry
  connectionType: number
}

const props = defineProps<{ config: SceneConfig }>()

const bridgeMaterials = ref<any[]>([])
let animationId: number

const bridgeSegments = computed(() => props.config.bridges.segments ?? 16)
const bridgeWidth = computed(() => props.config.bridges.width ?? 0.8)
const archHeight = computed(() => props.config.bridges.archHeight ?? 1.2)

// 生成桥梁条带几何体
function createBridgeGeometry(from: Vector3, to: Vector3, width: number, archHeight: number, segments: number) {
  const positions: number[] = []
  const indices: number[] = []
  const dir = to.clone().sub(from).normalize()
  const up = new Vector3(0, 1, 0)
  const side = new Vector3().crossVectors(dir, up).normalize().multiplyScalar(width / 2)
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const pos = from.clone().lerp(to, t)
    pos.y += archHeight * Math.sin(Math.PI * t)
    const left = pos.clone().add(side)
    const right = pos.clone().sub(side)
    positions.push(left.x, left.y, left.z)
    positions.push(right.x, right.y, right.z)
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2
    const b = a + 1
    const c = a + 2
    const d = a + 3
    indices.push(a, b, c)
    indices.push(b, d, c)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

// 计算桥梁数据
const bridges = computed(() => {
  const result: Bridge[] = []
  petersenConnections.forward.forEach(([fromId, toId]) => {
    const fromNode = petersenNodes.find(n => n.id === fromId)
    const toNode = petersenNodes.find(n => n.id === toId)
    if (fromNode && toNode) {
      const from = polarToCartesian(fromNode.r, fromNode.theta, props.config.bridges.height)
      const to = polarToCartesian(toNode.r, toNode.theta, props.config.bridges.height)
      const geometry = createBridgeGeometry(from, to, bridgeWidth.value, archHeight.value, bridgeSegments.value)
      result.push({
        geometry,
        connectionType: 0 // 可根据需要设置
      })
    }
  })
  return result
})

const createBridgeUniforms = (bridge: Bridge) => reactive({
  uTime: { value: 0.0 },
  uConnectionType: { value: bridge.connectionType }
})

const bridgeUniforms = computed(() => {
  return bridges.value.map(bridge => createBridgeUniforms(bridge))
})

const animate = () => {
  bridgeUniforms.value.forEach(uniforms => {
    uniforms.uTime.value += 0.016
  })
  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  animate()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
})

watch(() => props.config.bridges, () => { }, { deep: true })
</script>

<template>
  <TresGroup>
    <TresMesh
      v-for="(bridge, index) in bridges"
      :key="index"
      :geometry="bridge.geometry"
    >
      <TresShaderMaterial
        :ref="el => bridgeMaterials[index] = el"
        :vertexShader="tetherBridgeVertexShader"
        :fragmentShader="tetherBridgeFragmentShader"
        :uniforms="bridgeUniforms[index]"
        :transparent="true"
        :depthWrite="true"
        :side="2"
      />
    </TresMesh>
  </TresGroup>
</template>