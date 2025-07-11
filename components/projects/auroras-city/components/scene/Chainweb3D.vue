<script setup lang="ts">
import { ref } from 'vue'
import ChainwebGeometry from './ChainwebGeometry.vue'

interface Props {
  position?: [number, number, number]
  layerCount?: number
  layerSpacing?: number
  radiusScale?: number
  nodeSize?: number
  ringThickness?: number
  nodeShape?: 'cube' | 'sphere'
  rotationSpeed?: number
  useShaderMaterial?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  position: () => [0, 0, 0],
  layerCount: 20,
  layerSpacing: 0.5,
  radiusScale: 4,
  nodeSize: 0.1,
  ringThickness: 0.05,
  nodeShape: 'sphere',
  rotationSpeed: 0,
  useShaderMaterial: false
})

const showRings = ref(true)
const showNodes = ref(true)
const showSameChainConnections = ref(true)
const showCrossChainConnections = ref(true)

// Helper functions for colors
function getRingColor(): string {
  return '#4A90E2'
}

function getNodeColor(): string {
  return '#FF6B6B'
}

function getConnectionColor(): string {
  return '#FFFFFF'
}
</script>

<template>
  <TresGroup>
    <ChainwebGeometry
      :position="props.position"
      :layer-count="props.layerCount"
      :layer-spacing="props.layerSpacing"
      :radius-scale="props.radiusScale"
      :node-size="props.nodeSize"
      :ring-thickness="props.ringThickness"
      :node-shape="props.nodeShape"
      :rotation-speed="props.rotationSpeed"
      :use-shader-material="props.useShaderMaterial"
      :show-rings="showRings"
      :show-nodes="showNodes"
      :show-same-chain-connections="showSameChainConnections"
      :show-cross-chain-connections="showCrossChainConnections"
      :ring-color="getRingColor()"
      :node-color="getNodeColor()"
      :connection-color="getConnectionColor()"
    />
  </TresGroup>
</template>