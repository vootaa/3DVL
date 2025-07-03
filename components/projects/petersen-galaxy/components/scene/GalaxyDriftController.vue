<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { Vector3 } from 'three'
import { useRenderLoop } from '@tresjs/core'
import { galaxyDriftConfig, createInitialDriftState, type GalaxyDriftState } from '../../configs/galaxy-drift-config'
import { Logger } from '../../../../utils/logger'
import { LoggingConfig } from '../../configs/logging-config'

// Galaxy drift state
const driftState = ref<GalaxyDriftState>(createInitialDriftState())

// Internal time tracking for smooth motion
let noiseOffset = Math.random() * 1000

// Simple noise function for realistic perturbations
function noise(x: number): number {
  return Math.sin(x * 6.283) * 0.5 + Math.sin(x * 12.566) * 0.25 + Math.sin(x * 25.132) * 0.125
}

// Update galaxy center position
const updateGalaxyDrift = (deltaTime: number, totalTime: number) => {
  if (!galaxyDriftConfig.enabled) return

  const state = driftState.value
  const config = galaxyDriftConfig.motionPattern
  
  // Store previous position for velocity calculation
  const previousPosition = state.currentPosition.clone()
  
  // Primary drift motion
  const primaryDrift = config.primaryVelocity.clone().multiplyScalar(deltaTime)
  
  // Oscillatory motion for natural variation
  const oscillation = new Vector3(
    Math.sin(totalTime * config.oscillation.frequency.x + config.oscillation.phase.x) * config.oscillation.amplitude.x,
    Math.sin(totalTime * config.oscillation.frequency.y + config.oscillation.phase.y) * config.oscillation.amplitude.y,
    Math.sin(totalTime * config.oscillation.frequency.z + config.oscillation.phase.z) * config.oscillation.amplitude.z
  ).multiplyScalar(deltaTime * 0.1) // Scale down oscillation velocity
  
  // Random perturbations
  const perturbation = new Vector3(
    noise(totalTime * config.perturbation.frequency + noiseOffset),
    noise(totalTime * config.perturbation.frequency + noiseOffset + 100),
    noise(totalTime * config.perturbation.frequency + noiseOffset + 200)
  ).multiplyScalar(config.perturbation.strength * deltaTime)
  
  // Boundary return force
  const distanceFromOrigin = state.currentPosition.length()
  const boundaryForce = new Vector3()
  if (distanceFromOrigin > galaxyDriftConfig.boundaries.maxDistance) {
    const returnDirection = state.currentPosition.clone().normalize().multiplyScalar(-1)
    const forceStrength = (distanceFromOrigin - galaxyDriftConfig.boundaries.maxDistance) * galaxyDriftConfig.boundaries.returnForce
    boundaryForce.copy(returnDirection).multiplyScalar(forceStrength * deltaTime)
  }
  
  // Calculate total displacement for this frame
  const totalDisplacement = new Vector3()
    .add(primaryDrift)
    .add(oscillation)
    .add(perturbation)
    .add(boundaryForce)
  
  // Update position directly with displacement
  state.currentPosition.add(totalDisplacement)
  
  // Calculate actual velocity as position change / time interval
  if (deltaTime > 0) {
    const positionChange = state.currentPosition.clone().sub(previousPosition)
    state.velocity.copy(positionChange).divideScalar(deltaTime)
  }
  
  // Update statistics
  const frameDistance = state.currentPosition.distanceTo(previousPosition)
  state.totalDistance += frameDistance
  state.driftTime = totalTime
  
  // Update trail
  if (galaxyDriftConfig.showTrail) {
    state.trailPoints.push(state.currentPosition.clone())
    if (state.trailPoints.length > galaxyDriftConfig.trailLength) {
      state.trailPoints.shift()
    }
  }
}

// Render loop integration
const { onLoop } = useRenderLoop()

let frameCount = 0
let lastLogTime = 0
const LOG_INTERVAL = 5000 // Log every 5 seconds

onLoop(({ delta, elapsed }) => {
  const currentTime = elapsed
  const deltaTime = Math.min(delta, 0.1) // Cap delta time to prevent large jumps
  
  updateGalaxyDrift(deltaTime, currentTime)
  frameCount++
  
  // Expose current state to window for debugging
  if (typeof window !== 'undefined') {
    (window as any).__CURRENT_DRIFT_STATE__ = {
      position: {
        x: driftState.value.currentPosition.x,
        y: driftState.value.currentPosition.y,
        z: driftState.value.currentPosition.z
      },
      velocity: driftState.value.velocity.length(),
      lastUpdate: Date.now(),
      isActive: true,
      totalDistance: driftState.value.totalDistance,
      driftTime: driftState.value.driftTime
    }
  }
  
  // Simplified logging - only log key state changes
  const now = Date.now()
  if (now - lastLogTime > LOG_INTERVAL) {
    Logger.log('DRIFT_CONTROLLER', `System active: ${frameCount} frames, distance: ${driftState.value.totalDistance.toFixed(6)} GU`)
    lastLogTime = now
    frameCount = 0
  }
})

// Computed values for external consumption
const galaxyCenter = computed(() => driftState.value.currentPosition.clone())
const driftDuration = computed(() => driftState.value.driftTime)

// Computed values for display with proper scaling
const displayDriftPosition = computed(() => {
  // Scale up by 1000x for milli Galaxy Units (mGU)
  const scale = 1000
  return {
    x: (driftState.value.currentPosition.x * scale).toFixed(3),
    y: (driftState.value.currentPosition.y * scale).toFixed(3),
    z: (driftState.value.currentPosition.z * scale).toFixed(3)
  }
})

const displayDriftVelocity = computed(() => {
  // Velocity is already in GU/s, scale to mGU/s (1000x) for better readability
  const scale = 1000
  const speed = driftState.value.velocity.length() * scale
  return speed.toFixed(6)
})

const displayDriftDistance = computed(() => {
  // Scale up by 1000x for milli Galaxy Units (mGU)
  const scale = 1000
  return (driftState.value.totalDistance * scale).toFixed(6)
})

// Drift visualization control functions
const trailsEnabled = ref(false)
const velocityVectorsVisible = ref(false)
const trailIntensity = ref(0.5)

const enableTrails = (enabled: boolean) => {
  trailsEnabled.value = enabled
  Logger.log('DRIFT_CONTROLLER', `Trails ${enabled ? 'enabled' : 'disabled'}`)
}

const showVelocityVectors = (visible: boolean) => {
  velocityVectorsVisible.value = visible
  Logger.log('DRIFT_CONTROLLER', `Velocity vectors ${visible ? 'shown' : 'hidden'}`)
}

const setTrailIntensity = (intensity: number) => {
  trailIntensity.value = Math.max(0, Math.min(1, intensity))
  Logger.log('DRIFT_CONTROLLER', `Trail intensity set to ${trailIntensity.value}`)
}

// Drift controller interface for child components
const driftController = {
  enableTrails,
  showVelocityVectors,
  setTrailIntensity,
  trailsEnabled: computed(() => trailsEnabled.value),
  velocityVectorsVisible: computed(() => velocityVectorsVisible.value),
  trailIntensity: computed(() => trailIntensity.value)
}

// Provide galaxy center and drift controller to child components
provide('galaxyCenter', galaxyCenter)
provide('driftController', driftController)
provide('galaxyDriftData', {
  position: displayDriftPosition,
  velocity: displayDriftVelocity, 
  distance: displayDriftDistance,
  duration: driftDuration
})

// Also provide raw data for debugging
provide('rawDriftData', {
  currentPosition: computed(() => driftState.value.currentPosition),
  velocity: computed(() => driftState.value.velocity),
  totalDistance: computed(() => driftState.value.totalDistance),
  driftTime: computed(() => driftState.value.driftTime)
})

// Expose drift config to window for runtime checker
if (typeof window !== 'undefined') {
  (window as any).__DRIFT_CONFIG__ = galaxyDriftConfig
}

// Reset function for debugging
const resetDrift = () => {
  driftState.value = createInitialDriftState()
  noiseOffset = Math.random() * 1000
}

// Expose functions for parent component
defineExpose({
  resetDrift,
  driftState: computed(() => driftState.value),
  galaxyCenter
})
</script>

<template>
  <!-- This component provides drift data to its children -->
  <slot />
</template>
