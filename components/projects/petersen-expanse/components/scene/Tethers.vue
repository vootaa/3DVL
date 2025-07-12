<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  cameraRef?: any
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  globalTime: 0,
  evolutionProgress: 0,
  galaxyCenter: () => new Vector3(0, 0, 0),
  cameraRef: null
})

// Component refs
const tetherPointsRef = ref()
const tetherMaterialRef = ref()

// Static node data from star-cluster-config
const nodeStaticData = computed(() => {
  return starClusterConfig.stars.map(star => ({
    id: star.id,
    radius: star.r,
    angle: star.theta * Math.PI / 180, // Convert to radians
    type: star.type
  }))
})

// Only show tethers after evolution is complete
const shouldRender = computed(() => {
  return props.enabled && props.evolutionProgress >= 1.0
})

// Calculate tether particle attributes
const tetherAttributes = computed(() => {
  if (!shouldRender.value) {
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

  // Helper function to add particles for a connection
  const addConnectionParticles = (
    connection: [number, number], 
    archDirection: number, 
    color: { r: number; g: number; b: number }
  ) => {
    const [fromNodeId, toNodeId] = connection
    
    if (fromNodeId >= nodeStaticData.value.length || toNodeId >= nodeStaticData.value.length) {
      Logger.warn('TETHERS', `Invalid connection index: [${fromNodeId}, ${toNodeId}]`)
      return
    }

    const fromNode = nodeStaticData.value[fromNodeId]
    const toNode = nodeStaticData.value[toNodeId]

    // Generate particles for the connection
    for (let i = 0; i < tetherConfig.particlesPerTether; i++) {
      const t = i / (tetherConfig.particlesPerTether - 1) // Progress along the arch (0-1)

      // Initial reference position (shader will calculate actual dynamic position)
      const midRadius = (fromNode.radius + toNode.radius) * 0.5
      const midAngle = (fromNode.angle + toNode.angle) * 0.5
      
      positions.push(
        midRadius * Math.cos(midAngle),
        archDirection * tetherConfig.archHeight * Math.sin(t * Math.PI), // Arch height
        midRadius * Math.sin(midAngle)
      )

      // Color
      colors.push(color.r, color.g, color.b)

      // Alpha variation along the arch
      const alpha = Math.sin(t * Math.PI) * tetherConfig.baseOpacity
      alphas.push(alpha)

      tetherIds.push(tetherIndex)
      archParams.push(archDirection, t) // archDirection: 1 (upward) or -1 (downward), progress: t
      nodeIndices.push(fromNodeId, toNodeId) // Store the two node indices
      progressAlongArch.push(t)
    }
    tetherIndex++
  }

  // Handle forward connections (upward arch)
  tetherConnections.forward.forEach((connection) => {
    addConnectionParticles(connection as [number, number], 1, tetherConfig.colors.forward)
  })

  // Handle reverse connections (downward arch)
  tetherConnections.reverse.forEach((connection) => {
    addConnectionParticles(connection as [number, number], -1, tetherConfig.colors.reverse)
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
      
      // Global rotation parameter (synchronized with OrbitalSystem)
      uBaseRotationSpeed: { value: orbitalConfig.rotationSpeed },
      
      // Arch parameters
      uArchHeight: { value: tetherConfig.archHeight },
      
      // Node static data (for dynamic position calculation in shader)
      uNodeRadii: { value: nodeStaticData.value.map(n => n.radius) },
      uNodeAngles: { value: nodeStaticData.value.map(n => n.angle) }
    }
  }
})

// Render loop
const { onLoop } = useRenderLoop()
onLoop(() => {
  if (!shouldRender.value || !tetherMaterialRef.value?.uniforms) return

  const uniforms = tetherMaterialRef.value.uniforms

  // Update time parameters
  uniforms.uTime.value = props.globalTime
  uniforms.uEvolutionProgress.value = props.evolutionProgress

  // Update position (galaxy center offset)
  if (tetherPointsRef.value && props.galaxyCenter) {
    tetherPointsRef.value.position.copy(props.galaxyCenter)
  }
})

onMounted(() => {
  Logger.log('TETHERS', 'Tethers component mounted')
  Logger.log('TETHERS', `Config - Forward connections: ${tetherConnections.forward.length}, Reverse connections: ${tetherConnections.reverse.length}`)
  Logger.log('TETHERS', `Particle params - Particles per connection: ${tetherConfig.particlesPerTether}, Particle size: ${tetherConfig.particleSize}`)
})
</script>

<template>
  <TresGroup v-if="shouldRender && tetherAttributes && tetherShader">
    <TresPoints ref="tetherPointsRef">
      <TresBufferGeometry :attributes="tetherAttributes" />
      <TresShaderMaterial ref="tetherMaterialRef" v-bind="tetherShader" />
    </TresPoints>
  </TresGroup>
</template>