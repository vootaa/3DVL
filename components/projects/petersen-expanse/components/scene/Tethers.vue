<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'

import { starClusterConfig } from '../../configs/star-cluster-config'
import { tetherConfig } from '../../configs/tether-config'

interface Props {
  enabled?: boolean
  globalTime?: number
  evolutionProgress?: number
  stellarCoreNodes?: Array<{ position: THREE.Vector3; id: number }>
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  globalTime: 0,
  evolutionProgress: 0,
  stellarCoreNodes: () => []
})

// Tether geometry and material
const tetherGeometry = ref<THREE.BufferGeometry | null>(null)
const tetherMaterial = ref<THREE.ShaderMaterial | null>(null)
const tetherMesh = ref<THREE.Points | null>(null)

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
    
    const fromPos = new THREE.Vector3(
      fromNode.position.x,
      fromNode.position.y,
      fromNode.position.z
    )
    const toPos = new THREE.Vector3(
      toNode.position.x,
      toNode.position.y,
      toNode.position.z
    )
    
    // Create arch particles between nodes
    const particleCount = tetherConfig.particlesPerTether
    for (let i = 0; i < particleCount; i++) {
      const t = i / (particleCount - 1)
      
      // Quadratic Bézier curve for arch
      const midPoint = fromPos.clone().lerp(toPos, 0.5)
      midPoint.y += connection.archDirection * tetherConfig.archHeight
      
      const pos = new THREE.Vector3()
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
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1))
  geometry.setAttribute('tetherId', new THREE.Float32BufferAttribute(tetherIds, 1))
  geometry.setAttribute('archParams', new THREE.Float32BufferAttribute(archParams, 2))
  
  return geometry
}

// Create tether shader material
const createTetherMaterial = () => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uEvolutionProgress: { value: 0 },
      uGlowIntensity: { value: tetherConfig.glowIntensity },
      uFlowSpeed: { value: tetherConfig.flowSpeed },
      uPointSize: { value: tetherConfig.particleSize }
    },
    vertexShader: `
      attribute float alpha;
      attribute float tetherId;
      attribute vec2 archParams; // x: arch direction, y: progress along arch
      
      uniform float uTime;
      uniform float uEvolutionProgress;
      uniform float uPointSize;
      uniform float uFlowSpeed;
      
      varying float vAlpha;
      varying vec3 vColor;
      varying float vFlow;
      
      void main() {
        vColor = color;
        
        // Evolution progress affects chaos to order transition
        vec3 chaosOffset = vec3(
          sin(uTime * 2.0 + tetherId * 0.5) * (1.0 - uEvolutionProgress),
          cos(uTime * 1.5 + tetherId * 0.3) * (1.0 - uEvolutionProgress),
          sin(uTime * 1.8 + tetherId * 0.7) * (1.0 - uEvolutionProgress)
        ) * 50.0;
        
        vec3 finalPosition = position + chaosOffset * (1.0 - uEvolutionProgress);
        
        // Flowing animation along the arch
        float flowOffset = mod(uTime * uFlowSpeed + archParams.y * 6.28, 6.28);
        vFlow = sin(flowOffset) * 0.5 + 0.5;
        
        // Alpha combines base alpha with flow effect
        vAlpha = alpha * (0.7 + 0.3 * vFlow) * uEvolutionProgress;
        
        vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform float uGlowIntensity;
      
      varying float vAlpha;
      varying vec3 vColor;
      varying float vFlow;
      
      void main() {
        // Circular particle shape
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        
        if (dist > 0.5) discard;
        
        // Soft glow effect
        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
        glow = pow(glow, 2.0);
        
        // Flow effect adds brightness variation
        float brightness = uGlowIntensity * (0.8 + 0.2 * vFlow);
        
        vec3 finalColor = vColor * brightness;
        float finalAlpha = vAlpha * glow;
        
        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
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
    tetherMesh.value = new THREE.Points(tetherGeometry.value, tetherMaterial.value)
    tetherMesh.value.renderOrder = tetherConfig.renderOrder
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