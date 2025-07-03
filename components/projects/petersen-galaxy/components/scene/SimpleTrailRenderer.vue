<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Vector3 } from 'three'
import { Logger } from '../../../../utils/logger'
import { useDriftState } from '../../composables/useDriftState'

// Use global drift state
const { driftState } = useDriftState()

// Simple trail state
const trailVisible = ref(false)
const currentPosition = ref<[number, number, number]>([0, 0, 0])
const debugVisible = ref(true)

// Trail points for creating lines
const trailPoints = ref<Vector3[]>([])
const maxTrailPoints = 50 // Limit trail length

// Add point to trail
const addTrailPoint = (position: Vector3) => {
  trailPoints.value.push(position.clone())
  
  // Remove old points if too many
  if (trailPoints.value.length > maxTrailPoints) {
    trailPoints.value.shift()
  }
}

// Get positions array for line geometry
const getTrailPositions = () => {
  if (trailPoints.value.length < 2) return new Float32Array(0)
  
  const positions = new Float32Array(trailPoints.value.length * 3)
  for (let i = 0; i < trailPoints.value.length; i++) {
    const point = trailPoints.value[i]
    positions[i * 3] = point.x
    positions[i * 3 + 1] = point.y
    positions[i * 3 + 2] = point.z
  }
  return positions
}

// Watch for drift state changes
watch(
  () => driftState.trailsEnabled,
  (enabled) => {
    trailVisible.value = enabled
    Logger.log('SIMPLE_TRAIL', `Trail visibility: ${enabled}`)
  },
  { immediate: true }
)

// Watch for position changes
let lastLogTime = 0
let lastTrailPosition: Vector3 | null = null
watch(
  () => driftState.position,
  (position) => {
    if (position) {
      currentPosition.value = [position.x, position.y, position.z]
      
      // Add to trail if movement is significant
      const currentPos = new Vector3(position.x, position.y, position.z)
      const minDistance = 0.001 // Minimum distance to add new trail point
      
      if (!lastTrailPosition || currentPos.distanceTo(lastTrailPosition) > minDistance) {
        addTrailPoint(currentPos)
        lastTrailPosition = currentPos
      }
      
      // Log only every 5 seconds to avoid spam
      const now = Date.now()
      if (now - lastLogTime > 5000) {
        Logger.log('SIMPLE_TRAIL', `Position updated: (${position.x.toFixed(4)}, ${position.y.toFixed(4)}, ${position.z.toFixed(4)}), Trail points: ${trailPoints.value.length}`)
        lastLogTime = now
      }
    }
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  Logger.log('SIMPLE_TRAIL', 'Simple trail renderer mounted')
  Logger.log('SIMPLE_TRAIL', `Drift state:`, driftState)
  
  // Force visibility for testing
  trailVisible.value = true
})
</script>

<template>
  <!-- Always visible debug marker at origin -->
  <TresMesh :position="[0, 0, 0]" v-if="debugVisible">
    <TresSphereGeometry :args="[0.05, 8, 8]" />
    <TresMeshBasicMaterial color="#ff0000" />
  </TresMesh>
  
  <!-- Current position marker -->
  <TresMesh 
    v-if="trailVisible && currentPosition"
    :position="currentPosition"
  >
    <TresSphereGeometry :args="[0.02, 8, 8]" />
    <TresMeshBasicMaterial color="#00ffff" />
  </TresMesh>
  
  <!-- Trail indicator -->
  <TresMesh 
    v-if="trailVisible"
    :position="[currentPosition[0], currentPosition[1] + 0.1, currentPosition[2]]"
  >
    <TresBoxGeometry :args="[0.01, 0.05, 0.01]" />
    <TresMeshBasicMaterial color="#ffff00" />
  </TresMesh>
  
  <!-- Trail points as small spheres -->
  <TresMesh 
    v-for="(point, index) in trailPoints" 
    :key="index"
    :position="[point.x, point.y, point.z]"
    v-if="trailVisible && trailPoints.length > 0"
  >
    <TresSphereGeometry :args="[0.005, 4, 4]" />
    <TresMeshBasicMaterial 
      :color="`hsl(${180 + (index / trailPoints.length) * 60}, 100%, ${50 + (index / trailPoints.length) * 30}%)`"
      :transparent="true"
      :opacity="0.3 + (index / trailPoints.length) * 0.7"
    />
  </TresMesh>
  
  <!-- Trail line connecting all points -->
  <TresLine v-if="trailVisible && trailPoints.length > 1">
    <TresBufferGeometry>
      <TresBufferAttribute
        :count="trailPoints.length"
        :array="getTrailPositions()"
        :item-size="3"
        attach="attributes-position"
      />
    </TresBufferGeometry>
    <TresLineBasicMaterial 
      color="#00ccff" 
      :transparent="true" 
      :opacity="0.6"
    />
  </TresLine>
</template>
