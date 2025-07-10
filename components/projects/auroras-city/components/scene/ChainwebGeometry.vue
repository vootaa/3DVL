<script setup lang="ts">
import { shallowRef, onUnmounted, onMounted, computed } from 'vue'
import { DoubleSide, ShaderMaterial, Vector2, Clock, MeshBasicMaterial, Color, LineBasicMaterial } from 'three'
import { useLoop } from '@tresjs/core'

import { createChainwebGeometry, type ChainwebConfig } from '../../utils/chainwebGeometryUtils'

import sinusoidalTresJS2VertexShader from '../../shaders/sinusoidalTresJS2-vertex.glsl'
import fragmentShader from '../../shaders/fragment.glsl'

interface Props {
  position?: [number, number, number]
  scale?: [number, number, number]
  rotationSpeed?: number
  // Chainweb configuration
  layerCount?: number
  layerSpacing?: number
  radiusScale?: number
  nodeSize?: number
  ringThickness?: number
  segments?: number
  nodeShape?: 'cube' | 'sphere'
  // Display options
  showRings?: boolean
  showNodes?: boolean
  showSameChainConnections?: boolean
  showCrossChainConnections?: boolean
  // Material options
  useShaderMaterial?: boolean
  ringColor?: string
  nodeColor?: string
  connectionColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  position: () => [0, 0, 0],
  scale: () => [1, 1, 1],
  rotationSpeed: 0,
  layerCount: 10,
  layerSpacing: 0.5,
  radiusScale: 1,
  nodeSize: 0.1,
  ringThickness: 0.05,
  segments: 32,
  nodeShape: 'cube',
  showRings: true,
  showNodes: true,
  showSameChainConnections: true,
  showCrossChainConnections: true,
  useShaderMaterial: false,
  ringColor: '#4A90E2',
  nodeColor: '#FF6B6B',
  connectionColor: '#FFFFFF'
})

const chainwebGeometry = shallowRef()
const currentRotation = shallowRef<[number, number, number]>([0, 0, 0])
const clock = new Clock()

// Shader material for rings
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
  wireframe: false,
})

// Basic materials
const ringMaterial = new MeshBasicMaterial({ 
  color: new Color(props.ringColor), 
  side: DoubleSide,
  transparent: true,
  opacity: 0.8
})

const nodeMaterial = new MeshBasicMaterial({ 
  color: new Color(props.nodeColor),
  transparent: true,
  opacity: 0.9
})

const connectionMaterial = new LineBasicMaterial({ 
  color: new Color(props.connectionColor),
  transparent: true,
  opacity: 0.6
})

// Materials selection
const ringMat = computed(() => props.useShaderMaterial ? shaderMaterial : ringMaterial)
const nodeMat = computed(() => nodeMaterial)
const connectionMat = computed(() => connectionMaterial)

onMounted(() => {
  clock.start()
  
  const config: ChainwebConfig = {
    layerCount: props.layerCount,
    layerSpacing: props.layerSpacing,
    radiusScale: props.radiusScale,
    nodeSize: props.nodeSize,
    ringThickness: props.ringThickness,
    segments: props.segments,
    nodeShape: props.nodeShape
  }

  chainwebGeometry.value = createChainwebGeometry(config)
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
  if (ringMaterial) ringMaterial.dispose()
  if (nodeMaterial) nodeMaterial.dispose()
  if (connectionMaterial) connectionMaterial.dispose()
  
  if (chainwebGeometry.value) {
    // Dispose all geometries
    chainwebGeometry.value.rings.forEach(geo => geo.dispose())
    chainwebGeometry.value.nodes.forEach(geo => geo.dispose())
    chainwebGeometry.value.sameChainConnections.forEach(geo => geo.dispose())
    chainwebGeometry.value.crossChainConnections.forEach(geo => geo.dispose())
  }
  
  clock.stop()
})
</script>

<template>
  <TresGroup v-if="chainwebGeometry" :position="position" :scale="scale" :rotation="currentRotation">
    <!-- Ring Geometries -->
    <TresMesh 
      v-if="showRings"
      v-for="(ringGeo, index) in chainwebGeometry.rings" 
      :key="`ring-${index}`"
      :geometry="ringGeo"
      :material="ringMat"
    />
    
    <!-- Node Geometries -->
    <TresMesh 
      v-if="showNodes"
      v-for="(nodeGeo, index) in chainwebGeometry.nodes" 
      :key="`node-${index}`"
      :geometry="nodeGeo"
      :material="nodeMat"
    />
    
    <!-- Same Chain Connections -->
    <TresLine
      v-if="showSameChainConnections"
      v-for="(connectionGeo, index) in chainwebGeometry.sameChainConnections" 
      :key="`same-chain-${index}`"
      :geometry="connectionGeo"
      :material="connectionMat"
    />
    
    <!-- Cross Chain Connections -->
    <TresLine
      v-if="showCrossChainConnections"
      v-for="(connectionGeo, index) in chainwebGeometry.crossChainConnections" 
      :key="`cross-chain-${index}`"
      :geometry="connectionGeo"
      :material="connectionMat"
    />
  </TresGroup>
</template>