<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

import type { SceneConfig } from '../../config/scene-config'
import { petersenNodes, petersenConnections, polarToCartesian } from '../../config/scene-config'

import { createAllIrregularBridgesGeometry } from '../../utils/bridge-geometry'
import { tetherBridgeIrregularVertexShader, tetherBridgeIrregularFragmentShader } from '../../shaders/tether-bridge-shader'


const props = defineProps<{ config: SceneConfig }>()
const bridgeGeometry = ref()
const uniforms = ref({ 
  uTime: { value: 0.0 }
})

let animationId: number
const startTime = Date.now()

onMounted(() => {
  const bridges = petersenConnections.forward.map(([fromId, toId]) => {
    const fromNode = petersenNodes.find(n => n.id === fromId)!
    const toNode = petersenNodes.find(n => n.id === toId)!
    return {
      from: polarToCartesian(fromNode.r, fromNode.theta, props.config.bridges.height),
      to: polarToCartesian(toNode.r, toNode.theta, props.config.bridges.height)
    }
  })
  
  bridgeGeometry.value = createAllIrregularBridgesGeometry(
    bridges,
    props.config.bridges.width ?? 0.8,
    props.config.bridges.archHeight ?? 0.5,
    props.config.bridges.thickness ?? 0.25
  )
  
  const animate = () => {
    const elapsed = (Date.now() - startTime) / 1000
    uniforms.value.uTime.value = elapsed
    animationId = requestAnimationFrame(animate)
  }
  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<template>
  <TresGroup>
    <TresMesh v-if="bridgeGeometry" :geometry="bridgeGeometry">
      <TresShaderMaterial 
        :vertexShader="tetherBridgeIrregularVertexShader"
        :fragmentShader="tetherBridgeIrregularFragmentShader" 
        :uniforms="uniforms" 
        :transparent="false"
        :depthWrite="true" 
        :depthTest="true"
        :side="2"
        :flatShading="false"
      />
    </TresMesh>
  </TresGroup>
</template>