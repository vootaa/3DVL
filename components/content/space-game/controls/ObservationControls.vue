<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

import { GameMode, ObservationMode, POINTS_OF_INTEREST } from '../store/constants'

// eslint-disable-next-line import/namespace
import { gameStore } from '../GameStore'

// Add observation timer
const observationTime = ref(0)
const observationInterval = ref(null)
const requiredObservationTime = 20 // Seconds required to obtain stardust

// Watch for changes in current observation point to start/stop timer
watch(() => [gameStore.currentPointOfInterest, gameStore.observationMode], ([newPOI, newMode]) => {
  clearInterval(observationInterval.value)

  if (newPOI && newMode === ObservationMode.Orbiting) {
    observationTime.value = 0
    // Start a new timer
    const incrementTime = () => {
      observationTime.value++
    }
    observationInterval.value = setInterval(incrementTime, 1000)
  }
  else {
    observationTime.value = 0
  }
}, { immediate: true })

const remainingTime = computed(() => {
  if (!gameStore.currentPointOfInterest
        || gameStore.observedPoints.includes(gameStore.currentPointOfInterest)) {
    return 0
  }

  return Math.max(0, requiredObservationTime - observationTime.value)
})

const hasCollectedStardust = computed(() => {
  if (!gameStore.currentPointOfInterest) return false
  return gameStore.observedPoints.includes(gameStore.currentPointOfInterest)
})

// Calculate if player is near a point of interest (within 0.05 of track position)
const isNearPointOfInterest = (poiKey) => {
  const poi = POINTS_OF_INTEREST[poiKey]
  const t = gameStore.mutation.t
  const poiT = poi.trackPosition

  // Handle array of positions
  if (Array.isArray(poiT)) {
    return poiT.some(position => Math.abs(t - position) < 0.05)
  }

  // Handle single position
  return Math.abs(t - poiT) < 0.05
}

const observePointOfInterest = (poiKey) => {
  gameStore.actions.toggleObservationMode(poiKey)
}

const currentPoiName = computed(() => {
  if (!gameStore.currentPointOfInterest) return ''
  return POINTS_OF_INTEREST[gameStore.currentPointOfInterest].name
})

// Mouse handling for orbit controls
let isDragging = false
let lastMouseX = 0
let lastMouseY = 0

const handleMouseDown = (e) => {
  if (gameStore.observationMode === ObservationMode.Orbiting) {
    isDragging = true
    lastMouseX = e.clientX
    lastMouseY = e.clientY
  }
}

const handleMouseMove = (e) => {
  if (isDragging && gameStore.observationMode === ObservationMode.Orbiting) {
    const deltaX = e.clientX - lastMouseX
    const deltaY = e.clientY - lastMouseY

    // Update orbit angle based on mouse movement
    gameStore.orbitAngle -= deltaX * 0.005
    gameStore.orbitHeight -= deltaY * 0.005

    lastMouseX = e.clientX
    lastMouseY = e.clientY
  }
}

const handleMouseUp = () => {
  isDragging = false
}

const handleWheel = (e) => {
  if (gameStore.observationMode === ObservationMode.Orbiting) {
    // Adjust orbit distance with mouse wheel
    const delta = e.deltaY > 0 ? 5 : -5
    gameStore.mutation.orbitDistance = Math.max(30, Math.min(200, gameStore.mutation.orbitDistance + delta))
  }
}

// Add event listeners
onMounted(() => {
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('wheel', handleWheel)
})

onUnmounted(() => {
  clearInterval(observationInterval.value)

  window.removeEventListener('mousedown', handleMouseDown)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('wheel', handleWheel)
})
</script>

<template>
  <div
    v-if="gameStore.gameMode === GameMode.Explore"
    class="observation-controls"
  >
    <div v-if="gameStore.observationMode === ObservationMode.None">
      <div class="poi-header">
        Observe Points:
      </div>
      <div class="poi-buttons">
        <button
          v-for="(poi, key, index) in POINTS_OF_INTEREST"
          :key="key"
          :disabled="!isNearPointOfInterest(key)"
          class="poi-button"
          @click="observePointOfInterest(key)"
        >
          <span class="poi-number">{{ index + 1 }}</span> {{ poi.name }}
        </button>
      </div>
    </div>

    <div
      v-else
      class="orbit-controls"
    >
      <div class="orbit-info">
        <span class="observation-title">Observing: {{ currentPoiName }}</span>
        <div
          class="observation-timer"
          :class="{ completed: hasCollectedStardust }"
        >
          <template v-if="hasCollectedStardust">
            <div class="stardust-collected">
              <span class="stardust-icon">✧</span> Stardust Collected!
            </div>
            <div class="timer-value">
              {{ observationTime }}s
            </div>
          </template>
          <template v-else>
            <div class="timer-label">
              <span class="stardust-icon">✧</span> Collecting Stardust: {{ observationTime }}s
            </div>
            <div class="timer-progress">
              <div
                class="timer-bar"
                :style="{ width: `${(observationTime / requiredObservationTime) * 100}%` }"
              />
              <div class="timer-text">
                {{ remainingTime }}s remaining
              </div>
            </div>
          </template>
        </div>
        <button
          class="resume-button"
          @click="gameStore.actions.resumeJourney()"
        >
          Resume Journey
        </button>
      </div>

      <!-- Orbit control instructions -->
      <div class="orbit-instructions">
        Drag mouse to orbit • Scroll to zoom
      </div>
      <div class="orbit-data">
        <span class="orbit-distance">Distance: {{ Math.round(gameStore.mutation.orbitDistance) }} KM</span>
      </div>
    </div>
  </div>
</template>

<style>
.observation-controls {
    position: absolute;
    top: 280px;
    right: 20px;
    z-index: 100;
    font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
}

.poi-header {
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border-radius: 4px 4px 0 0;
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.poi-buttons {
    display: flex;
    flex-direction: column;
    gap: 5px;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px;
    border-radius: 0 0 4px 4px;
}

.poi-number {
    display: inline-block;
    width: 20px;
    height: 20px;
    line-height: 20px;
    text-align: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    margin-right: 5px;
    font-size: 0.8em;
    font-weight: bold;
}

.poi-button {
    padding: 8px 12px;
    background: transparent;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 180px;
    text-align: left;
    position: relative;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.poi-button:last-child {
    border-bottom: none;
}

.poi-button:hover:not([disabled]) {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 1);
}

.poi-button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
}

.observation-controls>div {
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    overflow: hidden;
}

.orbit-controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: rgba(0, 0, 0, 0.7);
    padding: 15px;
    border-radius: 8px;
    color: white;
    min-width: 180px;
}

.orbit-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
}

.observation-title {
    font-weight: 500;
    margin-bottom: 5px;
    font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
}

.resume-button {
    padding: 5px 10px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 4px;
    color: white;
    cursor: pointer;
    margin-left: 0;
    width: 100%;
    text-align: center;
    font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
    font-weight: 500;
    transition: all 0.2s;
}

.resume-button:hover {
    background: rgba(255, 255, 255, 0.3);
}

.orbit-instructions {
    font-size: 0.8em;
    opacity: 0.8;
}

.orbit-data {
    display: flex;
    justify-content: center;
    width: 100%;
    font-size: 0.9em;
    background: rgba(255, 255, 255, 0.1);
    padding: 5px 8px;
    border-radius: 4px;
    margin-bottom: 5px;
}

.orbit-distance {
    font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
    font-weight: 500;
    color: #a0e0ff;
    text-align: center;
}

.observation-timer {
    width: 100%;
    margin: 10px 0;
    padding: 8px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
}

.stardust-icon {
    color: #ffde87;
    text-shadow: 0 0 5px #ffaa00;
    font-size: 1.2em;
    margin-right: 2px;
}

.timer-label {
    font-size: 0.9em;
    color: #a0e0ff;
    margin-bottom: 5px;
}

.stardust-collected {
    font-size: 1.1em;
    color: #ffde87;
    font-weight: 500;
    text-shadow: 0 0 8px rgba(255, 218, 135, 0.8);
    margin-bottom: 5px;
    animation: glow 1.5s infinite alternate;
}

@keyframes glow {
    from {
        text-shadow: 0 0 5px rgba(255, 218, 135, 0.5);
    }

    to {
        text-shadow: 0 0 15px rgba(255, 218, 135, 0.9), 0 0 20px rgba(255, 255, 255, 0.5);
    }
}

.timer-value {
    font-size: 1.2em;
    font-weight: 700;
    color: #00ffaa;
}

.timer-progress {
    height: 20px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    overflow: hidden;
    position: relative;
    margin-top: 5px;
}

.timer-bar {
    height: 100%;
    background: linear-gradient(90deg, #4b6cb7, #8e54e9);
    box-shadow: 0 0 10px rgba(142, 84, 233, 0.8);
    border-radius: 10px;
    transition: width 1s linear;
}

.timer-text {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.8em;
    font-weight: 500;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
}

.observation-timer.completed {
    background: rgba(255, 218, 135, 0.15);
    border-color: rgba(255, 218, 135, 0.4);
}
</style>