<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ChainLayer from '../../../echo-mission/3d/ChainLayer.vue'

interface ChainRing {
  position: [number, number, number]
  rotation: { x: number; y: number; z: number }
  scale: number
}

interface Props {
  position?: [number, number, number]
  layerCount?: number
  baseRadius?: number
  heightSpacing?: number
}

const props = withDefaults(defineProps<Props>(), {
  position: () => [0, 0, 0],
  layerCount: 20,
  baseRadius: 25,
  heightSpacing: 0.5, 
})

const chainLayers = ref<ChainRing[]>([])
const showConnections = ref(true)
const showCrossChainConnections = ref(true)

// Generate chainweb 3D data
function generateChainweb3D(): ChainRing[] {
    const layers: ChainRing[] = []
    const baseY = props.position[1]
    
    for (let i = 0; i < props.layerCount; i++) {
        const height = baseY + i * props.heightSpacing

        layers.push({
            position: [0, height, 0],
            rotation: {
                x: Math.PI/2, 
                y: 0, 
                z: 0
            },
            scale: 4
        })
    }
    
    return layers
}

onMounted(() => {
    chainLayers.value = generateChainweb3D()
})

// Helper functions
function shouldShowLayerConnections(index: number): boolean {
  return showConnections.value && index < chainLayers.value.length - 1
}

function shouldShowCrossChainConnections(index: number): boolean {
  return showCrossChainConnections.value && showConnections.value && index < chainLayers.value.length - 1
}

function getNextLayerPosition(index: number): [number, number, number] {
  if (index >= chainLayers.value.length - 1) {
    return [0, 0, 0]
  }
  return chainLayers.value[index + 1].position
}

function getNextLayerRotation(index: number): [number, number, number] {
  if (index >= chainLayers.value.length - 1) {
    return [0, 0, 0]
  }
  const rotation = chainLayers.value[index + 1].rotation
  return [rotation.x, rotation.y, rotation.z]
}

function getNextLayerScale(index: number): number {
  if (index >= chainLayers.value.length - 1) {
    return 1
  }
  return chainLayers.value[index + 1].scale
}

function getConnectionColor(index: number): string {
  const colors = ['#4A90E2', '#7B68EE', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
  const colorIndex = index % colors.length
  return colors[colorIndex]
}
</script>

<template>
  <TresGroup>
    <ChainLayer
      v-for="(ring, i) of chainLayers"
      :key="i"
      :position="ring.position"
      :rotation="[ring.rotation.x, ring.rotation.y, ring.rotation.z]"
      :scale="ring.scale"
      :show-nodes="true"
      :layer-id="i"
      :show-layer-connections="shouldShowLayerConnections(i)"
      :show-cross-chain-connections="shouldShowCrossChainConnections(i)"
      :next-layer-position="getNextLayerPosition(i)"
      :next-layer-rotation="getNextLayerRotation(i)"
      :next-layer-scale="getNextLayerScale(i)"
      :connection-color="getConnectionColor(i)"
      :inner-color="i % 2 === 0 ? '#4A90E2' : '#7B68EE'"
      :middle-color="i % 2 === 0 ? '#FF6B6B' : '#4ECDC4'"
      :outer-color="i % 2 === 0 ? '#45B7D1' : '#96CEB4'"
    />
  </TresGroup>
</template>