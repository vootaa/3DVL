<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Vector3, BufferAttribute, AdditiveBlending, ShaderMaterial } from 'three'
import { useRenderLoop } from '@tresjs/core'

import { tetherConfig, tetherConnections } from '../../configs/tether-config'
import { starClusterConfig } from '../../configs/star-cluster-config'
import { RotationManager } from '../../composables/rotationManager'
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

// Get rotation manager instance
const rotationManager = RotationManager.getInstance()

// Component refs
const tetherGroupRef = ref()
const tetherPointsRef = ref()

// Component state
const isComponentMounted = ref(false)
const isInitialized = ref(false)

// Geometry data
const geometryAttributes = ref<Record<string, BufferAttribute>>({})
const materialUniforms = ref<Record<string, { value: any }>>({})

// Node data cache
const nodeData = ref<Array<{
  id: number
  radius: number
  angle: number
  type: string
}>>([])

function initializeTethers() {
  if (isInitialized.value) return

  try {
    Logger.log('TETHERS', 'Initializing tether flow particles...')

    // Validate data
    if (!starClusterConfig?.stars || starClusterConfig.stars.length === 0) {
      throw new Error('No star data available')
    }

    // Prepare node data (base angles without rotation)
    nodeData.value = starClusterConfig.stars.map(star => ({
      id: star.id,
      radius: star.r,
      angle: star.theta * Math.PI / 180, // Base angle
      type: star.type
    }))

    // Generate particle data
    const positions: number[] = []
    const colors: number[] = []
    const alphas: number[] = []
    const tetherIds: number[] = []
    const archParams: number[] = []
    const nodeIndices: number[] = []
    const particleIndices: number[] = []

    let connectionIndex = 0

    // Helper function to add connection particles
    const addConnection = (
      connection: number[],
      direction: number,
      color: { r: number; g: number; b: number }
    ) => {
      const [fromId, toId] = connection
      
      if (fromId >= nodeData.value.length || toId >= nodeData.value.length) {
        Logger.warn('TETHERS', `Invalid connection: [${fromId}, ${toId}]`)
        return
      }

      for (let i = 0; i < tetherConfig.particlesPerTether; i++) {
        // Initial reference position (will be computed in shader)
        positions.push(0, 0, 0)

        // Color
        colors.push(color.r, color.g, color.b)
        
        // Base alpha
        alphas.push(tetherConfig.baseOpacity)
        
        // Tether ID
        tetherIds.push(connectionIndex)
        
        // Arch parameters: direction and particle index
        archParams.push(direction, i)
        
        // Node indices for shader lookup
        nodeIndices.push(fromId, toId)
        
        // Particle index in this tether
        particleIndices.push(i)
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
      particleIndex: new BufferAttribute(new Float32Array(particleIndices), 1)
    }

    // Create material uniforms using rotation manager
    materialUniforms.value = {
      ...rotationManager.getShaderUniforms(),
      uPointSize: { value: tetherConfig.particleSize },
      uFlowSpeed: { value: tetherConfig.flowSpeed },
      uArchHeight: { value: tetherConfig.archHeight },
      uParticleSpacing: { value: tetherConfig.particleSpacing },
      uTrailLength: { value: tetherConfig.trailLength },
      uNodeRadii: { value: new Float32Array(nodeData.value.map(n => n.radius)) },
      uNodeAngles: { value: new Float32Array(nodeData.value.map(n => n.angle)) }
    }

    isInitialized.value = true
    
    Logger.log('TETHERS', `Initialized ${positions.length / 3} flow particles for ${connectionIndex} connections`)

  } catch (error) {
    Logger.error('TETHERS', 'Failed to initialize tethers', error)
  }
}

// Render loop
let renderLoopCleanup: (() => void) | null = null

function startRenderLoop() {
  if (renderLoopCleanup) return

  const { onLoop, resume } = useRenderLoop()
  
  const stopLoop = onLoop(() => {
    if (!isComponentMounted.value || 
        !props.enabled || 
        !isInitialized.value || 
        props.evolutionProgress < 1.0) return

    try {
      // Update rotation manager
      rotationManager.updateTime(props.globalTime)
      rotationManager.updateEvolution(props.evolutionProgress)

      // Update material uniforms
      if (tetherPointsRef.value?.material) {
        const material = tetherPointsRef.value.material as ShaderMaterial
        const shaderUniforms = rotationManager.getShaderUniforms()
        
        Object.keys(shaderUniforms).forEach(key => {
          if (material.uniforms[key]) {
            material.uniforms[key].value = shaderUniforms[key].value
          }
        })
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

// Watch for evolution progress
watch(() => props.evolutionProgress, (progress) => {
  if (progress >= 1.0 && !isInitialized.value && props.enabled) {
    initializeTethers()
  }
})

// Watch for enabled state
watch(() => props.enabled, (enabled) => {
  if (enabled && isComponentMounted.value) {
    startRenderLoop()
    if (props.evolutionProgress >= 1.0 && !isInitialized.value) {
      initializeTethers()
    }
  } else {
    stopRenderLoop()
  }
})

onMounted(() => {
  isComponentMounted.value = true
  
  if (props.enabled) {
    startRenderLoop()
    if (props.evolutionProgress >= 1.0) {
      initializeTethers()
    }
  }
})

onUnmounted(() => {
  isComponentMounted.value = false
  stopRenderLoop()
})
</script>

<template>
  <TresGroup 
    v-if="props.enabled && isInitialized && props.evolutionProgress >= 1.0"
    ref="tetherGroupRef"
  >
    <TresPoints 
      v-if="Object.keys(geometryAttributes).length > 0"
      ref="tetherPointsRef"
    >
      <TresBufferGeometry 
        :position="[geometryAttributes.position.array, 3]"
        :color="[geometryAttributes.color.array, 3]"
        :alpha="[geometryAttributes.alpha.array, 1]"
        :tether-id="[geometryAttributes.tetherId.array, 1]"
        :arch-params="[geometryAttributes.archParams.array, 2]"
        :node-indices="[geometryAttributes.nodeIndices.array, 2]"
        :particle-index="[geometryAttributes.particleIndex.array, 1]"
      />
      <TresShaderMaterial
        v-if="Object.keys(materialUniforms).length > 0"
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