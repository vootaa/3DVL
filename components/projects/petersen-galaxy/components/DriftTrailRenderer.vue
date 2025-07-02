<script setup lang="ts">
import { ref, inject, watch, onMounted, onUnmounted } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { Vector3, AdditiveBlending } from 'three'
import { Logger } from '../../../utils/logger'

// Inject drift controller and data
const driftController = inject<any>('driftController')
const galaxyDriftData = inject<any>('galaxyDriftData')

// Trail state
const trailRef = ref()
const isTrailVisible = ref(false)
const maxTrailPoints = 100
const trailPoints = ref<Vector3[]>([])
const trailOpacities = ref<number[]>([])

// Clear trail data
const clearTrail = () => {
  trailPoints.value = []
  trailOpacities.value = []
}

// Watch for drift controller trail state
watch(
  () => driftController?.trailsEnabled?.value,
  (enabled) => {
    isTrailVisible.value = enabled
    if (!enabled) {
      clearTrail()
    }
    Logger.log('DRIFT_TRAIL_RENDERER', `Trail visibility: ${enabled}`)
  },
  { immediate: true }
)

// Add point to trail
const addTrailPoint = (position: Vector3) => {
  // Add new point
  trailPoints.value.push(position.clone())
  trailOpacities.value.push(1.0)
  
  // Remove old points if too many
  if (trailPoints.value.length > maxTrailPoints) {
    trailPoints.value.shift()
    trailOpacities.value.shift()
  }
  
  // Fade older points
  for (let i = 0; i < trailOpacities.value.length; i++) {
    const age = i / (trailOpacities.value.length - 1)
    trailOpacities.value[i] = Math.pow(age, 0.5) // Square root fade for better visibility
  }
}

// Update trail geometry
const updateTrailGeometry = () => {
  if (!trailRef.value || trailPoints.value.length < 2) return
  
  const geometry = trailRef.value.geometry
  const positions = new Float32Array(trailPoints.value.length * 3)
  const alphas = new Float32Array(trailPoints.value.length)
  
  for (let i = 0; i < trailPoints.value.length; i++) {
    const point = trailPoints.value[i]
    positions[i * 3] = point.x
    positions[i * 3 + 1] = point.y
    positions[i * 3 + 2] = point.z
    alphas[i] = trailOpacities.value[i]
  }
  
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('alpha', new Float32BufferAttribute(alphas, 1))
  geometry.setDrawRange(0, trailPoints.value.length)
}

// Render loop
const { onLoop } = useRenderLoop()

onLoop(() => {
  if (!isTrailVisible.value) return
  
  // Get current drift position from global window state
  if (typeof window !== 'undefined') {
    const driftState = (window as any).__CURRENT_DRIFT_STATE__
    if (driftState && driftState.position) {
      const currentPos = new Vector3(
        driftState.position.x,
        driftState.position.y,
        driftState.position.z
      )
      
      // Add point to trail if it's different enough from the last one
      const lastPoint = trailPoints.value[trailPoints.value.length - 1]
      if (!lastPoint || currentPos.distanceTo(lastPoint) > 0.001) {
        addTrailPoint(currentPos)
        updateTrailGeometry()
      }
    }
  }
})

// Vertex shader for trail
const vertexShader = `
attribute float alpha;
varying float vAlpha;
varying vec3 vPosition;

void main() {
  vAlpha = alpha;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 3.0;
}
`

// Fragment shader for trail
const fragmentShader = `
varying float vAlpha;
varying vec3 vPosition;

void main() {
  // Create glowing trail effect
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  
  // Color progression: cyan to blue based on position
  vec3 color = mix(
    vec3(0.0, 1.0, 1.0), // cyan
    vec3(0.2, 0.6, 1.0), // blue
    sin(length(vPosition) * 0.5) * 0.5 + 0.5
  );
  
  gl_FragColor = vec4(color, vAlpha * glow * 0.8);
}
`

// Shader uniforms
const uniforms = ref({
  time: { value: 0.0 },
  intensity: { value: 0.8 }
})

onMounted(() => {
  Logger.log('DRIFT_TRAIL_RENDERER', 'Trail renderer component mounted')
})

onUnmounted(() => {
  clearTrail()
  Logger.log('DRIFT_TRAIL_RENDERER', 'Trail renderer component unmounted')
})
</script>

<template>
  <TresPoints 
    v-if="isTrailVisible && trailPoints.length > 0"
    ref="trailRef"
  >
    <TresBufferGeometry>
      <!-- Dynamic position attribute will be updated in the render loop -->
    </TresBufferGeometry>
    <TresShaderMaterial
      :uniforms="uniforms"
      :vertex-shader="vertexShader"
      :fragment-shader="fragmentShader"
      :transparent="true"
      :blending="AdditiveBlending"
      :depth-test="false"
    />
  </TresPoints>
</template>
