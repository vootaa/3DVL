<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Vector3, BufferAttribute, AdditiveBlending } from 'three'
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

// Component state
const isComponentMounted = ref(false)
const isDataReady = ref(false)
const hasInitialized = ref(false)

// Refs for Three.js components
const tetherGroupRef = ref()
const tetherPointsRef = ref()
const tetherMaterialRef = ref()

// Geometry attributes
const geometryAttributes = ref<Record<string, BufferAttribute>>({})

// Material uniforms
const materialUniforms = ref<Record<string, { value: any }>>({})

// Check if should render
const shouldRender = ref(false)

// Initialize tether data
function initializeTethers() {
  if (hasInitialized.value) return
  
  try {
    Logger.log('TETHERS', 'Initializing tethers...')

    // Validate required data
    if (!starClusterConfig?.stars || starClusterConfig.stars.length === 0) {
      throw new Error('No star data available')
    }

    if (!tetherVertexShader || !tetherFragmentShader) {
      throw new Error('Shaders not loaded')
    }

    // Prepare node data
    const nodeData = starClusterConfig.stars.map(star => ({
      id: star.id,
      radius: star.r,
      angle: star.theta * Math.PI / 180,
      type: star.type
    }))

    // Generate particle data
    const positions: number[] = []
    const colors: number[] = []
    const alphas: number[] = []
    const tetherIds: number[] = []
    const archParams: number[] = []
    const nodeIndices: number[] = []
    const progressValues: number[] = []

    let connectionIndex = 0

    // Helper function
    const addConnection = (
      connection: number[],
      direction: number,
      color: { r: number; g: number; b: number }
    ) => {
      const [fromId, toId] = connection
      
      if (fromId >= nodeData.length || toId >= nodeData.length) {
        Logger.warn('TETHERS', `Invalid connection: [${fromId}, ${toId}]`)
        return
      }

      const fromNode = nodeData[fromId]
      const toNode = nodeData[toId]

      for (let i = 0; i < tetherConfig.particlesPerTether; i++) {
        const t = i / (tetherConfig.particlesPerTether - 1)

        // Reference position
        const midRadius = (fromNode.radius + toNode.radius) * 0.5
        const midAngle = (fromNode.angle + toNode.angle) * 0.5
        
        positions.push(
          midRadius * Math.cos(midAngle),
          direction * tetherConfig.archHeight * Math.sin(t * Math.PI),
          midRadius * Math.sin(midAngle)
        )

        colors.push(color.r, color.g, color.b)
        alphas.push(Math.sin(t * Math.PI) * tetherConfig.baseOpacity)
        tetherIds.push(connectionIndex)
        archParams.push(direction, t)
        nodeIndices.push(fromId, toId)
        progressValues.push(t)
      }
      connectionIndex++
    }

    // Add all connections
    tetherConnections.forward.forEach(conn => 
      addConnection(conn, 1, tetherConfig.colors.forward)
    )
    
    tetherConnections.reverse.forEach(conn => 
      addConnection(conn, -1, tetherConfig.colors.reverse)
    )

    // Create buffer attributes
    geometryAttributes.value = {
      position: new BufferAttribute(new Float32Array(positions), 3),
      color: new BufferAttribute(new Float32Array(colors), 3),
      alpha: new BufferAttribute(new Float32Array(alphas), 1),
      tetherId: new BufferAttribute(new Float32Array(tetherIds), 1),
      archParams: new BufferAttribute(new Float32Array(archParams), 2),
      nodeIndices: new BufferAttribute(new Float32Array(nodeIndices), 2),
      progressAlongArch: new BufferAttribute(new Float32Array(progressValues), 1)
    }

    // Create material uniforms
    materialUniforms.value = {
      uTime: { value: 0.0 },
      uEvolutionProgress: { value: 0.0 },
      uPointSize: { value: tetherConfig.particleSize },
      uGlowIntensity: { value: tetherConfig.glowIntensity },
      uFlowSpeed: { value: tetherConfig.flowSpeed },
      uPulseFrequency: { value: tetherConfig.pulseFrequency },
      uBaseRotationSpeed: { value: orbitalConfig.rotationSpeed },
      uArchHeight: { value: tetherConfig.archHeight },
      uNodeRadii: { value: new Float32Array(nodeData.map(n => n.radius)) },
      uNodeAngles: { value: new Float32Array(nodeData.map(n => n.angle)) }
    }

    hasInitialized.value = true
    isDataReady.value = true
    
    Logger.log('TETHERS', `Initialized ${positions.length / 3} particles for ${connectionIndex} connections`)

  } catch (error) {
    Logger.error('TETHERS', 'Failed to initialize tethers', error)
  }
}

// Update shouldRender based on conditions
function updateRenderState() {
  shouldRender.value = props.enabled && 
                      props.evolutionProgress >= 1.0 && 
                      isComponentMounted.value && 
                      isDataReady.value
}

// Watch for evolution progress
watch(() => props.evolutionProgress, (progress) => {
  if (progress >= 1.0 && !hasInitialized.value) {
    initializeTethers()
  }
  updateRenderState()
})

// Watch for enabled state
watch(() => props.enabled, () => {
  updateRenderState()
})

// Render loop - only register when component is mounted
let renderLoopCleanup: (() => void) | null = null

function startRenderLoop() {
  if (renderLoopCleanup) return

  const { onLoop, resume } = useRenderLoop()
  
  const stopLoop = onLoop(() => {
    if (!isComponentMounted.value || !shouldRender.value) return

    try {
      // Update material uniforms
      if (tetherMaterialRef.value?.uniforms) {
        const uniforms = tetherMaterialRef.value.uniforms
        uniforms.uTime.value = props.globalTime
        uniforms.uEvolutionProgress.value = props.evolutionProgress
      }

      // Update position
      if (tetherGroupRef.value && props.galaxyCenter) {
        tetherGroupRef.value.position.copy(props.galaxyCenter)
      }
    } catch (error) {
      Logger.throttle('TETHERS_LOOP', 'Render loop error', error)
    }
  })

  renderLoopCleanup = () => stopLoop.off()
  resume()
}

function stopRenderLoop() {
  if (renderLoopCleanup) {
    renderLoopCleanup()
    renderLoopCleanup = null
  }
}

onMounted(() => {
  isComponentMounted.value = true
  Logger.log('TETHERS', 'Component mounted')
  
  // Initialize if evolution is already complete
  if (props.evolutionProgress >= 1.0) {
    initializeTethers()
  }
  
  updateRenderState()
  startRenderLoop()
})

onUnmounted(() => {
  isComponentMounted.value = false
  stopRenderLoop()
  Logger.log('TETHERS', 'Component unmounted')
})
</script>

<template>
  <TresGroup 
    v-if="shouldRender"
    ref="tetherGroupRef"
  >
    <TresPoints 
      v-if="Object.keys(geometryAttributes).length > 0"
      ref="tetherPointsRef"
    >
      <TresBufferGeometry 
        :attributes="geometryAttributes"
      />
      <TresShaderMaterial
        v-if="Object.keys(materialUniforms).length > 0"
        ref="tetherMaterialRef"
        :transparent="true"
        :depth-write="false"
        :blending="AdditiveBlending"
        :vertex-colors="true"
        :vertex-shader="tetherVertexShader"
        :fragment-shader="tetherFragmentShader"
        :uniforms="materialUniforms"
      />
    </TresPoints>
  </TresGroup>
</template>