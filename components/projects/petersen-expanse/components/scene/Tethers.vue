<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
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

// Internal state
const isInitialized = ref(false)
const hasError = ref(false)
const isReady = ref(false)

// Static node data from star-cluster-config
const nodeStaticData = computed(() => {
  try {
    if (!starClusterConfig?.stars) {
      return []
    }
    return starClusterConfig.stars.map(star => ({
      id: star.id,
      radius: star.r,
      angle: star.theta * Math.PI / 180,
      type: star.type
    }))
  } catch (error) {
    Logger.error('TETHERS', 'Failed to process node static data', error)
    hasError.value = true
    return []
  }
})

// Only show tethers after evolution is complete
const shouldRender = computed(() => {
  return props.enabled && 
         props.evolutionProgress >= 1.0 && 
         !hasError.value && 
         isInitialized.value &&
         isReady.value &&
         nodeStaticData.value.length > 0
})

// Geometry and material data (separated for better control)
const geometryData = ref<{
  position: BufferAttribute
  color: BufferAttribute
  alpha: BufferAttribute
  tetherId: BufferAttribute
  archParams: BufferAttribute
  nodeIndices: BufferAttribute
  progressAlongArch: BufferAttribute
} | null>(null)

const materialConfig = ref<{
  transparent: boolean
  depthWrite: boolean
  blending: any
  vertexColors: boolean
  vertexShader: string
  fragmentShader: string
  uniforms: Record<string, { value: any }>
} | null>(null)

// Initialize tether data
async function initializeTethers() {
  if (isInitialized.value || hasError.value) return

  try {
    Logger.log('TETHERS', 'Initializing tether data...')

    // Validate shaders first
    if (!tetherVertexShader || !tetherFragmentShader) {
      throw new Error('Shader files not loaded')
    }

    // Validate node data
    if (nodeStaticData.value.length === 0) {
      throw new Error('No node data available')
    }

    // Validate config data
    if (!tetherConfig || !tetherConnections) {
      throw new Error('Tether configuration not loaded')
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
        const t = i / (tetherConfig.particlesPerTether - 1)

        // Initial reference position
        const midRadius = (fromNode.radius + toNode.radius) * 0.5
        const midAngle = (fromNode.angle + toNode.angle) * 0.5
        
        positions.push(
          midRadius * Math.cos(midAngle),
          archDirection * tetherConfig.archHeight * Math.sin(t * Math.PI),
          midRadius * Math.sin(midAngle)
        )

        colors.push(color.r, color.g, color.b)

        const alpha = Math.sin(t * Math.PI) * tetherConfig.baseOpacity
        alphas.push(alpha)

        tetherIds.push(tetherIndex)
        archParams.push(archDirection, t)
        nodeIndices.push(fromNodeId, toNodeId)
        progressAlongArch.push(t)
      }
      tetherIndex++
    }

    // Handle connections
    tetherConnections.forward.forEach((connection) => {
      addConnectionParticles(connection as [number, number], 1, tetherConfig.colors.forward)
    })

    tetherConnections.reverse.forEach((connection) => {
      addConnectionParticles(connection as [number, number], -1, tetherConfig.colors.reverse)
    })

    // Validate data
    const particleCount = positions.length / 3
    if (colors.length !== particleCount * 3 ||
        alphas.length !== particleCount ||
        tetherIds.length !== particleCount ||
        archParams.length !== particleCount * 2 ||
        nodeIndices.length !== particleCount * 2 ||
        progressAlongArch.length !== particleCount) {
      throw new Error(`Attribute array length mismatch. Expected ${particleCount} particles`)
    }

    // Wait for next tick to ensure DOM is ready
    await nextTick()

    // Create geometry data
    geometryData.value = {
      position: new BufferAttribute(new Float32Array(positions), 3),
      color: new BufferAttribute(new Float32Array(colors), 3),
      alpha: new BufferAttribute(new Float32Array(alphas), 1),
      tetherId: new BufferAttribute(new Float32Array(tetherIds), 1),
      archParams: new BufferAttribute(new Float32Array(archParams), 2),
      nodeIndices: new BufferAttribute(new Float32Array(nodeIndices), 2),
      progressAlongArch: new BufferAttribute(new Float32Array(progressAlongArch), 1)
    }

    // Create material config (safe object without non-serializable properties)
    materialConfig.value = {
      transparent: true,
      depthWrite: false,
      blending: tetherConfig.blendMode,
      vertexColors: true,
      vertexShader: tetherVertexShader,
      fragmentShader: tetherFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uEvolutionProgress: { value: 0.0 },
        uPointSize: { value: tetherConfig.particleSize },
        uGlowIntensity: { value: tetherConfig.glowIntensity },
        uFlowSpeed: { value: tetherConfig.flowSpeed },
        uPulseFrequency: { value: tetherConfig.pulseFrequency },
        uBaseRotationSpeed: { value: orbitalConfig.rotationSpeed },
        uArchHeight: { value: tetherConfig.archHeight },
        uNodeRadii: { value: [...nodeStaticData.value.map(n => n.radius)] }, // Clone array
        uNodeAngles: { value: [...nodeStaticData.value.map(n => n.angle)] }  // Clone array
      }
    }

    isInitialized.value = true
    
    // Wait another tick before marking as ready
    await nextTick()
    isReady.value = true

    Logger.log('TETHERS', `Generated ${particleCount} tether particles, ${tetherIndex} connections`)

  } catch (error) {
    Logger.error('TETHERS', 'Failed to initialize tethers', error)
    hasError.value = true
  }
}

// Watch for evolution progress to trigger initialization
watch(() => props.evolutionProgress, async (progress) => {
  if (progress >= 1.0 && !isInitialized.value && !hasError.value) {
    await initializeTethers()
  }
})

// Render loop
const { onLoop } = useRenderLoop()
onLoop(() => {
  if (!shouldRender.value) return

  try {
    // Safely access material uniforms
    const material = tetherMaterialRef.value
    if (!material?.uniforms) return

    // Update uniforms
    material.uniforms.uTime.value = props.globalTime
    material.uniforms.uEvolutionProgress.value = props.evolutionProgress

    // Update position
    const points = tetherPointsRef.value
    if (points && props.galaxyCenter) {
      points.position.copy(props.galaxyCenter)
    }
  } catch (error) {
    Logger.throttle('TETHERS_LOOP', 'Error in render loop', error)
  }
})

onMounted(async () => {
  Logger.log('TETHERS', 'Tethers component mounted')
  
  // Initialize immediately if evolution is already complete
  if (props.evolutionProgress >= 1.0) {
    await initializeTethers()
  }
})
</script>

<template>
  <TresGroup v-if="shouldRender && geometryData && materialConfig">
    <TresPoints ref="tetherPointsRef">
      <TresBufferGeometry :attributes="geometryData" />
      <TresShaderMaterial 
        ref="tetherMaterialRef"
        :transparent="materialConfig.transparent"
        :depth-write="materialConfig.depthWrite"
        :blending="materialConfig.blending"
        :vertex-colors="materialConfig.vertexColors"
        :vertex-shader="materialConfig.vertexShader"
        :fragment-shader="materialConfig.fragmentShader"
        :uniforms="materialConfig.uniforms"
      />
    </TresPoints>
  </TresGroup>
</template>