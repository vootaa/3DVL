<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Vector3, BufferAttribute } from 'three'
import { useRenderLoop } from '@tresjs/core'

import { tetherConfig, tetherConnections } from '../../configs/tether-config'
import { starClusterConfig } from '../../configs/star-cluster-config'
import { orbitalConfig } from '../../configs/orbital-config'
import { Logger } from '../../../../utils/logger'

import tetherVertexShader from '../../shaders/tether-vertex.glsl'
import tetherFragmentShader from '../../shaders/tether-fragment.glsl'

interface Props {
  enabled?: boolean
  globalTime?: number
  evolutionProgress?: number
  galaxyCenter?: Vector3
  stellarCorePositions?: Vector3[]
  cameraRef?: any
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  globalTime: 0,
  evolutionProgress: 0,
  galaxyCenter: () => new Vector3(0, 0, 0),
  stellarCorePositions: () => [],
  cameraRef: null
})

// Component refs
const tetherPointsRef = ref()
const tetherMaterialRef = ref()

// Static node data - get initial angle and radius from star-cluster-config
const nodeStaticData = computed(() => {
  return starClusterConfig.stars.map(star => ({
    id: star.id,
    initialRadius: star.r,
    initialAngle: star.theta * Math.PI / 180, // Convert to radians
    type: star.type
  }))
})

// Calculate tether particle attributes
const tetherAttributes = computed(() => {
  if (!props.stellarCorePositions || props.stellarCorePositions.length < 20) {
    Logger.throttle('TETHERS_ATTR', `Waiting for stellar core position data: ${props.stellarCorePositions?.length || 0}/20`)
    return null
  }

  const positions: number[] = []
  const colors: number[] = []
  const alphas: number[] = []
  const tetherIds: number[] = []
  const archParams: number[] = []
  const nodeIndices: number[] = []
  const progressAlongArch: number[] = []

  let tetherIndex = 0

  // Handle forward connections (upward arch)
  tetherConnections.forward.forEach((connection, connectionIndex) => {
    const [fromNodeId, toNodeId] = connection
    
    if (fromNodeId >= nodeStaticData.value.length || toNodeId >= nodeStaticData.value.length) {
      Logger.warn('TETHERS', `Invalid connection index: [${fromNodeId}, ${toNodeId}]`)
      return
    }

    // Get static node data (for dynamic position calculation in shader)
    const fromNode = nodeStaticData.value[fromNodeId]
    const toNode = nodeStaticData.value[toNodeId]

    // Generate particles for the connection
    for (let i = 0; i < tetherConfig.particlesPerTether; i++) {
      const t = i / (tetherConfig.particlesPerTether - 1) // Progress along the arch (0-1)

      // Static position (shader will calculate actual position dynamically based on time)
      // Only provide initial arch reference position here
      const midRadius = (fromNode.initialRadius + toNode.initialRadius) * 0.5
      const midAngle = (fromNode.initialAngle + toNode.initialAngle) * 0.5
      
      positions.push(
        midRadius * Math.cos(midAngle),
        tetherConfig.archHeight * Math.sin(t * Math.PI), // Arch height
        midRadius * Math.sin(midAngle)
      )

      // Forward color (cyan)
      const color = tetherConfig.colors.forward
      colors.push(color.r, color.g, color.b)

      // Alpha variation along the arch
      const alpha = Math.sin(t * Math.PI) * tetherConfig.baseOpacity
      alphas.push(alpha)

      tetherIds.push(tetherIndex)
      archParams.push(1, t) // archDirection: 1 (upward), progress: t
      nodeIndices.push(fromNodeId, toNodeId) // Store the two node indices of the connection
      progressAlongArch.push(t)
    }
    tetherIndex++
  })

  // Handle reverse connections (downward arch)
  tetherConnections.reverse.forEach((connection, connectionIndex) => {
    const [fromNodeId, toNodeId] = connection
    
    if (fromNodeId >= nodeStaticData.value.length || toNodeId >= nodeStaticData.value.length) {
      Logger.warn('TETHERS', `Invalid connection index: [${fromNodeId}, ${toNodeId}]`)
      return
    }

    const fromNode = nodeStaticData.value[fromNodeId]
    const toNode = nodeStaticData.value[toNodeId]

    for (let i = 0; i < tetherConfig.particlesPerTether; i++) {
      const t = i / (tetherConfig.particlesPerTether - 1)

      const midRadius = (fromNode.initialRadius + toNode.initialRadius) * 0.5
      const midAngle = (fromNode.initialAngle + toNode.initialAngle) * 0.5
      
      positions.push(
        midRadius * Math.cos(midAngle),
        -tetherConfig.archHeight * Math.sin(t * Math.PI), // Downward arch
        midRadius * Math.sin(midAngle)
      )

      // Reverse color (orange)
      const color = tetherConfig.colors.reverse
      colors.push(color.r, color.g, color.b)

      const alpha = Math.sin(t * Math.PI) * tetherConfig.baseOpacity
      alphas.push(alpha)

      tetherIds.push(tetherIndex)
      archParams.push(-1, t) // archDirection: -1 (downward), progress: t
      nodeIndices.push(fromNodeId, toNodeId)
      progressAlongArch.push(t)
    }
    tetherIndex++
  })

  // Validate data integrity
  const particleCount = positions.length / 3
  if (colors.length !== particleCount * 3 ||
      alphas.length !== particleCount ||
      tetherIds.length !== particleCount ||
      archParams.length !== particleCount * 2 ||
      nodeIndices.length !== particleCount * 2 ||
      progressAlongArch.length !== particleCount) {
    Logger.error('TETHERS', 'Attribute array length mismatch')
    return null
  }

  Logger.log('TETHERS', `Generated ${particleCount} tether particles, ${tetherIndex} connections`)

  return {
    position: new BufferAttribute(new Float32Array(positions), 3),
    color: new BufferAttribute(new Float32Array(colors), 3),
    alpha: new BufferAttribute(new Float32Array(alphas), 1),
    tetherId: new BufferAttribute(new Float32Array(tetherIds), 1),
    archParams: new BufferAttribute(new Float32Array(archParams), 2),
    nodeIndices: new BufferAttribute(new Float32Array(nodeIndices), 2),
    progressAlongArch: new BufferAttribute(new Float32Array(progressAlongArch), 1)
  }
})

// Shader material config
const tetherShader = computed(() => {
  if (!tetherVertexShader || !tetherFragmentShader) {
    Logger.error('TETHERS', 'Shader files not loaded')
    return null
  }

  return {
    transparent: true,
    depthWrite: false,
    blending: tetherConfig.blendMode,
    vertexColors: true,
    vertexShader: tetherVertexShader,
    fragmentShader: tetherFragmentShader,
    uniforms: {
      // Time parameters
      uTime: { value: 0.0 },
      uEvolutionProgress: { value: 0.0 },
      
      // Visual parameters
      uPointSize: { value: tetherConfig.particleSize },
      uGlowIntensity: { value: tetherConfig.glowIntensity },
      
      // Animation parameters
      uFlowSpeed: { value: tetherConfig.flowSpeed },
      uPulseFrequency: { value: tetherConfig.pulseFrequency },
      
      // Global rotation parameter (keep in sync with OrbitalSystem)
      uBaseRotationSpeed: { value: orbitalConfig.rotationSpeed },
      
      // Arch parameters
      uArchHeight: { value: tetherConfig.archHeight },
      
      // Node static data (for dynamic position calculation in shader)
      uNodeRadii: { value: nodeStaticData.value.map(n => n.initialRadius) },
      uNodeAngles: { value: nodeStaticData.value.map(n => n.initialAngle) }
    }
  }
})

// Render loop
const { onLoop } = useRenderLoop()
onLoop(() => {
  if (!props.enabled || !tetherMaterialRef.value?.uniforms) return

  const uniforms = tetherMaterialRef.value.uniforms

  // Update time parameters
  uniforms.uTime.value = props.globalTime
  uniforms.uEvolutionProgress.value = props.evolutionProgress

  // Update position (galaxy center offset)
  if (tetherPointsRef.value && props.galaxyCenter) {
    tetherPointsRef.value.position.copy(props.galaxyCenter)
  }
})

// Watch for stellar core position changes
watch(() => props.stellarCorePositions, (newPositions) => {
  if (!newPositions || newPositions.length === 0) {
    Logger.throttle('TETHERS_WATCH', 'Waiting for stellar core position data...')
    return
  }

  if (newPositions.length !== 20) {
    Logger.throttle('TETHERS_WATCH', `Expected 20 stellar positions, got ${newPositions.length}`)
    return
  }

  Logger.throttle('TETHERS_WATCH', 'Stellar core positions updated, recalculating tether connections')
}, { deep: true, immediate: true })

onMounted(() => {
  Logger.log('TETHERS', 'Tethers component mounted')
  Logger.log('TETHERS', `Config - Forward connections: ${tetherConnections.forward.length}, Reverse connections: ${tetherConnections.reverse.length}`)
  Logger.log('TETHERS', `Particle params - Particles per connection: ${tetherConfig.particlesPerTether}, Particle size: ${tetherConfig.particleSize}`)
})
</script>

<template>
  <TresGroup v-if="enabled && tetherAttributes && tetherShader">
    <TresPoints ref="tetherPointsRef">
      <TresBufferGeometry :attributes="tetherAttributes" />
      <TresShaderMaterial ref="tetherMaterialRef" v-bind="tetherShader" />
    </TresPoints>
  </TresGroup>
</template>