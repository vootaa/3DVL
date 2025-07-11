<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useLoop } from '@tresjs/core'
import { Vector3, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Points, AdditiveBlending } from 'three'

import { starClusterConfig } from '../../configs/star-cluster-config'
import { tetherConfig } from '../../configs/tether-config'

import tetherVertexShader from '../../shaders/tether-vertex.glsl'
import tetherFragmentShader from '../../shaders/tether-fragment.glsl'

interface Props {
  enabled?: boolean
  globalTime?: number
  evolutionProgress?: number
  stellarCoreNodes?: Array<{ r: number; theta: number; id: number }>
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  globalTime: 0,
  evolutionProgress: 0,
  stellarCoreNodes: () => []
})

// Tether geometry and material
const tetherGeometry = ref<BufferGeometry | null>(null)
const tetherMaterial = ref<ShaderMaterial | null>(null)
const tetherMesh = ref<Points | null>(null)

// Petersen Graph connections (60 edges total: 30 forward + 30 reverse)
const petersenConnections = computed(() => {
  const connections = []
  
  // Forward connections (arching upward)
  for (let i = 0; i < 10; i++) {
    connections.push({
      from: i,
      to: (i + 5) % 10,
      direction: 'forward',
      archDirection: 1 // upward
    })
    connections.push({
      from: i,
      to: i + 10,
      direction: 'forward', 
      archDirection: 1
    })
    connections.push({
      from: i + 10,
      to: 10 + ((i + 1) % 10),
      direction: 'forward',
      archDirection: 1
    })
  }
  
  // Reverse connections (arching downward)
  for (let i = 0; i < 10; i++) {
    connections.push({
      from: (i + 5) % 10,
      to: i,
      direction: 'reverse',
      archDirection: -1 // downward
    })
    connections.push({
      from: i + 10,
      to: i,
      direction: 'reverse',
      archDirection: -1
    })
    connections.push({
      from: 10 + ((i + 1) % 10),
      to: i + 10,
      direction: 'reverse',
      archDirection: -1
    })
  }
  
  return connections
})

// Create tether particles geometry
const createTetherGeometry = () => {
  const positions: number[] = []
  const colors: number[] = []
  const alphas: number[] = []
  const tetherIds: number[] = []
  const archParams: number[] = [] // stores arch direction and progress
  
  petersenConnections.value.forEach((connection, tetherIndex) => {
    const fromNode = starClusterConfig.stars[connection.from]
    const toNode = starClusterConfig.stars[connection.to]
    
    if (!fromNode || !toNode) return
    
    // Convert polar coordinates (r, theta) to Cartesian coordinates (x, y, z)
    const fromPos = new Vector3(
      fromNode.r * Math.cos(fromNode.theta),
      0,
      fromNode.r * Math.sin(fromNode.theta)
    )
    const toPos = new Vector3(
      toNode.r * Math.cos(toNode.theta),
      0,
      toNode.r * Math.sin(toNode.theta)
    )
    
    // Create arch particles between nodes
    const particleCount = tetherConfig.particlesPerTether
    for (let i = 0; i < particleCount; i++) {
      const t = i / (particleCount - 1)
      
      // Quadratic Bézier curve for arch
      const midPoint = fromPos.clone().lerp(toPos, 0.5)
      midPoint.y += connection.archDirection * tetherConfig.archHeight
      
      const pos = new Vector3()
        .copy(fromPos)
        .multiplyScalar((1 - t) * (1 - t))
        .add(midPoint.clone().multiplyScalar(2 * (1 - t) * t))
        .add(toPos.clone().multiplyScalar(t * t))
      
      positions.push(pos.x, pos.y, pos.z)
      
      // Color based on direction and position along arch
      const color = connection.direction === 'forward' 
        ? tetherConfig.colors.forward
        : tetherConfig.colors.reverse
      colors.push(color.r, color.g, color.b)
      
      // Alpha varies along the arch (fade at ends)
      const alpha = Math.sin(t * Math.PI) * tetherConfig.baseOpacity
      alphas.push(alpha)
      
      tetherIds.push(tetherIndex)
      archParams.push(connection.archDirection, t) // direction, progress along arch
    }
  })
  
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('alpha', new Float32BufferAttribute(alphas, 1))
  geometry.setAttribute('tetherId', new Float32BufferAttribute(tetherIds, 1))
  geometry.setAttribute('archParams', new Float32BufferAttribute(archParams, 2))
  
  return geometry
}

// Create tether shader material
const createTetherMaterial = () => {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uEvolutionProgress: { value: 0 },
      uGlowIntensity: { value: tetherConfig.glowIntensity },
      uFlowSpeed: { value: tetherConfig.flowSpeed },
      uPointSize: { value: tetherConfig.particleSize }
    },
    vertexShader: tetherVertexShader,
    fragmentShader: tetherFragmentShader,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    vertexColors: true
  })
}

// Initialize tethers
const initializeTethers = () => {
  if (!props.enabled) return
  
  tetherGeometry.value = createTetherGeometry()
  tetherMaterial.value = createTetherMaterial()
  
  if (tetherGeometry.value && tetherMaterial.value) {
    tetherMesh.value = new Points(tetherGeometry.value, tetherMaterial.value)
    if (tetherMesh.value) {
      tetherMesh.value.renderOrder = tetherConfig.renderOrder
    }
  }
}

// Update tethers based on evolution progress and stellar core positions
const updateTethers = () => {
  if (!tetherMaterial.value || !props.enabled) return
  
  tetherMaterial.value.uniforms.uTime.value = props.globalTime
  tetherMaterial.value.uniforms.uEvolutionProgress.value = props.evolutionProgress
  
  // Update geometry if stellar core nodes have moved
  if (props.stellarCoreNodes.length === 20) {
    // Recreate geometry with updated node positions
    const newGeometry = createTetherGeometry()
    if (tetherMesh.value && newGeometry) {
      tetherMesh.value.geometry.dispose()
      tetherMesh.value.geometry = newGeometry
      tetherGeometry.value = newGeometry
    }
  }
}

// Cleanup
const cleanup = () => {
  if (tetherGeometry.value) {
    tetherGeometry.value.dispose()
    tetherGeometry.value = null
  }
  if (tetherMaterial.value) {
    tetherMaterial.value.dispose()
    tetherMaterial.value = null
  }
  tetherMesh.value = null
}

// Animation loop
const { onBeforeRender } = useLoop()
onBeforeRender(() => {
  updateTethers()
})

// Watch for changes
watch(() => props.enabled, (enabled) => {
  if (enabled) {
    initializeTethers()
  } else {
    cleanup()
  }
})

watch(() => props.stellarCoreNodes, () => {
  if (props.enabled) {
    updateTethers()
  }
}, { deep: true })

onMounted(() => {
  if (props.enabled) {
    initializeTethers()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <TresGroup v-if="enabled && tetherMesh">
    <primitive :object="tetherMesh" />
  </TresGroup>
</template>