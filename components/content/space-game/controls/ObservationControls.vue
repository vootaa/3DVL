<script setup lang="ts">
import { computed, ref, watch, onUnmounted, inject } from 'vue'

import { Logger } from '../../logger'
import { GameState } from '../core/constants'
import { gameStateManager } from '../core/GameStateManager'
import { POINTS_OF_INTEREST } from '../store/constants'

import type { IGameController } from '../core/types'
import type { GameStore } from '../GameStore'

const gameStore = inject('gameStore') as GameStore
const gameController = inject('gameController') as { value: IGameController }

Logger.log('OBSERVATION_CONTROLS', 'GameController injected', {
  hasController: !!gameController,
  hasValue: !!gameController?.value
})

const currentGameState = computed(() => {
  if (gameController?.value?.getCurrentState) {
    return gameController.value.getCurrentState()
  }
  return gameStateManager.getCurrentState()
})

const isExploreMode = computed(() => {
  if (gameController?.value?.isExploreMode) {
    return gameController.value.isExploreMode()
  }
  return gameStateManager.isExploreMode()
})

const isObservationMode = computed(() => {
  if (gameController?.value?.isObservationMode) {
    return gameController.value.isObservationMode()
  }
  return gameStateManager.isObservationMode()
})

// observation timer
const observationTime = ref(0)
const observationInterval = ref<number | null>(null)
const requiredObservationTime = 20 // Seconds required to obtain stardust

// Watch for changes in current observation point to start/stop timer
watch(() => [gameStore.currentPointOfInterest, currentGameState.value],
  ([newPOI, newState]) => {
    if (observationInterval.value) {
      clearInterval(observationInterval.value)
      observationInterval.value = null
    }

    if (newPOI && newState === GameState.OBSERVATION) {
      observationTime.value = 0
      // Start a new timer
      observationInterval.value = window.setInterval(() => {
        observationTime.value++
      }, 1000)

      Logger.log('OBSERVATION_CONTROLS', 'Observation timer started', {
        pointOfInterest: newPOI,
        requiredTime: requiredObservationTime
      })
    } else {
      observationTime.value = 0
      if (newPOI === null) {
        Logger.log('OBSERVATION_CONTROLS', 'Observation timer stopped')
      }
    }
  },
  { immediate: true }
)

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
const isNearPointOfInterest = (poiKey: keyof typeof POINTS_OF_INTEREST) => {
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

const observePointOfInterest = (poiKey: keyof typeof POINTS_OF_INTEREST) => {
  Logger.log('OBSERVATION_CONTROLS', 'Attempting to observe point of interest', {
    poiKey,
    hasController: !!gameController?.value,
    hasEnterObservationMethod: !!gameController?.value?.enterObservation
  })

  // Consistently use reactive reference
  if (gameController?.value) {
    if (typeof gameController.value.enterObservation === 'function') {
      gameController.value.enterObservation(poiKey)
      Logger.log('OBSERVATION_CONTROLS', 'Observation started via controller', { poiKey })
    } else {
      Logger.error('OBSERVATION_CONTROLS', 'enterObservation is not a function on gameController.value', {
        controllerMethods: Object.keys(gameController.value),
        poiKey
      })

      // Fallback strategy - directly use gameStateManager
      if (gameStateManager.canObserve()) {
        if (gameStateManager.setState(GameState.OBSERVATION)) {
          // Manually set observation point
          gameStore.currentPointOfInterest = poiKey

          // Set observation mode parameters
          const poi = POINTS_OF_INTEREST[poiKey]
          const track = gameStore.mutation.track
          const mutation = gameStore.mutation

          // Pause movement
          mutation.previousPosition.copy(mutation.position)
          mutation.previousTime = Date.now()
          mutation.isPaused = true

          // Set orbit parameters
          const poiPosition = Array.isArray(poi.trackPosition)
            ? poi.trackPosition[0]
            : poi.trackPosition

          mutation.orbitCenter.copy(track.parameters.path.getPointAt(poiPosition).multiplyScalar(mutation.scale))
          mutation.orbitDistance = poi.orbitDistance
          mutation.orbitSpeed = poi.orbitSpeed

          // Initialize orbit angles
          gameStore.orbitAngle = 0
          gameStore.orbitHeight = 0

          Logger.log('OBSERVATION_CONTROLS', 'Observation started via fallback method', {
            poiKey,
            poiName: poi.name,
            orbitDistance: poi.orbitDistance,
            orbitSpeed: poi.orbitSpeed
          })
        } else {
          Logger.error('OBSERVATION_CONTROLS', 'Failed to set observation state', { poiKey })
        }
      } else {
        Logger.error('OBSERVATION_CONTROLS', 'Cannot observe - state manager restriction', {
          poiKey,
          currentState: gameStateManager.getCurrentState()
        })
      }
    }
  } else {
    Logger.error('OBSERVATION_CONTROLS', 'No gameController available for observation', { poiKey })
  }
}

const resumeJourney = () => {
  Logger.log('OBSERVATION_CONTROLS', 'Attempting to resume journey', {
    hasController: !!gameController?.value,
    hasExitObservationMethod: !!gameController?.value?.exitObservation,
    currentPOI: gameStore.currentPointOfInterest
  })

  // Consistently use reactive reference
  if (gameController?.value) {
    if (typeof gameController.value.exitObservation === 'function') {
      gameController.value.exitObservation()
      Logger.log('OBSERVATION_CONTROLS', 'Journey resumed via controller')
    } else {
      Logger.error('OBSERVATION_CONTROLS', 'exitObservation is not a function on gameController.value', {
        controllerMethods: Object.keys(gameController.value)
      })

      // Fallback strategy
      if (gameStateManager.setState(GameState.EXPLORE)) {
        const mutation = gameStore.mutation

        // Resume movement
        if (mutation.isPaused) {
          mutation.startTime += (Date.now() - mutation.previousTime)
          mutation.isPaused = false
        }

        const previousPOI = gameStore.currentPointOfInterest
        gameStore.currentPointOfInterest = null

        Logger.log('OBSERVATION_CONTROLS', 'Journey resumed via fallback method', {
          previousPOI,
          wasePaused: mutation.isPaused
        })
      } else {
        Logger.error('OBSERVATION_CONTROLS', 'Failed to set explore state for journey resume')
      }
    }
  } else {
    Logger.error('OBSERVATION_CONTROLS', 'No gameController available for resume')
  }
}

const currentPoiName = computed(() => {
  if (!gameStore.currentPointOfInterest) return ''
  return POINTS_OF_INTEREST[gameStore.currentPointOfInterest].name
})

onUnmounted(() => {
  if (observationInterval.value) {
    clearInterval(observationInterval.value)
    Logger.log('OBSERVATION_CONTROLS', 'Component unmounted, cleared observation timer')
  }
})
</script>

<template>
  <div class="observation-controls" v-show="isExploreMode || isObservationMode">
    <!-- POI Selection UI - when in explore mode but not in observation mode -->
    <div v-if="isExploreMode">
      <div class="poi-header">
        Observe Points:
      </div>
      <div class="poi-buttons">
        <button v-for="(poi, key, index) in POINTS_OF_INTEREST" :key="key" :disabled="!isNearPointOfInterest(key)"
          class="poi-button" @click="observePointOfInterest(key)">
          <span class="poi-number">{{ index + 1 }}</span> {{ poi.name }}
        </button>
      </div>
    </div>
    <!-- Observation UI - when in observation mode -->
    <div v-else-if="isObservationMode" class="orbit-controls">
      <div class="orbit-info">
        <span class="observation-title">Observing: {{ currentPoiName }}</span>
        <div class="observation-timer" :class="{ completed: hasCollectedStardust }">
          <template v-if="hasCollectedStardust">
            <div class="stardust-collected">
              <span class="stardust-icon">✧</span> Stardust Collected!
            </div>
          </template>
          <template v-else>
            <div class="timer-label">
              <span class="stardust-icon">✧</span> Collecting Stardust: {{ observationTime }}s
            </div>
            <div class="timer-progress">
              <div class="timer-bar" :style="{ width: `${(observationTime / requiredObservationTime) * 100}%` }" />
              <div class="timer-text">
                {{ remainingTime }}s remaining
              </div>
            </div>
          </template>
        </div>
        <button class="resume-button" @click="resumeJourney">
          Resume Journey
        </button>
      </div>

      <!-- Orbit control instructions -->
      <div class="orbit-instructions">
        <div>Drag mouse to orbit</div>
        <div>Scroll to zoom</div>
      </div>
      <div class="orbit-data">
        <div class="orbit-row">
          <span class="orbit-distance">
            <i class="orbit-icon distance-icon">↕</i> Zoom Distance: {{ (gameStore.mutation.orbitDistance /
            1000).toFixed(2) }} AU
          </span>
        </div>
        <div class="orbit-row">
          <span class="orbit-angle">
            <i class="orbit-icon angle-icon">↻</i> Azimuth: {{ Math.round(gameStore.orbitAngle * 57.3) }}°
          </span>
        </div>
        <div class="orbit-row">
          <span class="orbit-height">
            <i class="orbit-icon height-icon">⇅</i> Elevation: {{ Math.round(gameStore.orbitHeight * 57.3) }}°
          </span>
        </div>
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
  line-height: 1.3;
  text-align: center;
}

.orbit-instructions div {
  margin-bottom: 2px;
}

.orbit-instructions div:last-child {
  margin-bottom: 0;
}

.orbit-data {
  display: flex;
  flex-direction: column;
  width: 100%;
  font-size: 0.9em;
  background: rgba(255, 255, 255, 0.1);
  padding: 5px 8px;
  border-radius: 4px;
  margin-bottom: 5px;
  gap: 5px;
}

.orbit-row {
  display: flex;
  width: 100%;
  justify-content: center;
  padding: 3px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.orbit-row:last-child {
  border-bottom: none;
}

.orbit-distance,
.orbit-angle,
.orbit-height {
  font-family: 'Kode Mono', 'Teko', monospace, sans-serif;
  font-weight: 500;
  text-align: center;
  width: 100%;
}

.orbit-distance {
  color: #a0e0ff;
}

.orbit-angle {
  color: #ffcc77;
}

.orbit-height {
  color: #77ffaa;
}

.orbit-icon {
  display: inline-block;
  margin-right: 4px;
  font-style: normal;
}

.distance-icon {
  transform: rotate(45deg);
}

.angle-icon {
  font-size: 1.1em;
}

.height-icon {
  font-weight: bold;
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
  margin-right: 6px;
  display: inline-block;
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
  text-align: center;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes glow {
  from {
    text-shadow: 0 0 5px rgba(255, 218, 135, 0.5);
  }

  to {
    text-shadow: 0 0 15px rgba(255, 218, 135, 0.9), 0 0 20px rgba(255, 255, 255, 0.5);
  }
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
  background: transparent;
  border: none;
  padding: 0;
}
</style>