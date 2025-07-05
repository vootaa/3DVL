<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three'
import { ref, provide, watch, onMounted, nextTick, computed } from 'vue'
import OrbitalSystem from './components/scene/OrbitalSystem.vue'
import StarCluster from './components/scene/StarCluster.vue'
import TrailRenderer from './components/scene/TrailRenderer.vue'
import SwitchMenuBar from './components/menu/SwitchMenuBar.vue'
import ToolsMenuBar from './components/menu/ToolsMenuBar.vue'
import CameraInfo from './components/hud/CameraInfo.vue'
import GalaxyDriftController from './components/scene/GalaxyDriftController.vue'
import EvolutionTimeline from './components/hud/EvolutionTimeline.vue'
import TrailReviewTimeline from './components/hud/TrailReviewTimeline.vue'
import RendererStatsCollector from './components/utilities/RendererStatsCollector.vue'
import { CameraController } from './utils/camera-controller'
import DriftRuntimeChecker from './utils/drift-runtime-checker'

import './utils/drift-validator' // Import to trigger auto-diagnostic

const gl = {
  clearColor: '#000811',
  shadows: true,
  alpha: false,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
}

const starControlRef = ref()
const trailControlRef = ref()
const cameraRef = ref()
const orbitControlsRef = ref()
const showGridAfterCameraMove = ref(false)

// Star evolution state - track if evolution has already happened
const hasEvolutionOccurred = ref(false)

// Camera controller instance
let cameraController: CameraController

// Provide refs immediately (they will be reactive)
provide('camera', cameraRef)
provide('orbitControls', orbitControlsRef)

const orbitControlsConfig = {
  enableDamping: true,
  dampingFactor: 0.05,
  minDistance: 2,
  maxDistance: 10,
  minPolarAngle: Math.PI * 0.05,
  maxPolarAngle: Math.PI * 0.9,
  enablePan: false,
}

// Global trail review state
const isReviewingTrail = ref(false)
const trailReviewProgress = ref(0)
const isTrailReviewAvailable = ref(false) // Trail review mode available indicator
const currentPresetId = ref<string | null>(null) // Current camera preset id

// EvolutionTimeline visibility state
const isEvolutionTimelineVisible = ref(false)
function handleEvolutionTimelineVisible(val: boolean) {
  isEvolutionTimelineVisible.value = val
}

const controlsDisabled = computed(() =>
  isReviewingTrail.value || isEvolutionTimelineVisible.value
)

// Provide global state for child components
provide('isReviewingTrail', isReviewingTrail)
provide('trailReviewProgress', trailReviewProgress)

// Provide for CameraPresets to record the current preset
function setCurrentPresetId(id: string | null) {
  currentPresetId.value = id
}
provide('setCurrentPresetId', setCurrentPresetId)

const galaxyDriftControllerRef = ref()
const trailRendererRef = ref()

// Provide for CameraPresets
provide('trailRendererRef', trailRendererRef)
provide('startTrailReview', startTrailReview)
function setTrailReviewAvailable(val: boolean) {
  isTrailReviewAvailable.value = val
}
provide('setTrailReviewAvailable', setTrailReviewAvailable)

// Trail review trigger function
async function startTrailReview(trailPoints: any[]) {
  if (!trailPoints || trailPoints.length < 2) return

  trailReviewProgress.value = 0
  isTrailReviewAvailable.value = false
  isReviewingTrail.value = true
  isTrailStopped.value = true // Stop sampling and new data rendering

  const galaxyDriftController = galaxyDriftControllerRef.value
  if (galaxyDriftController?.startTrailReview) {
    await galaxyDriftController.startTrailReview(trailPoints, (progress: number) => {
      trailReviewProgress.value = progress
    })
  }

  isReviewingTrail.value = false
  trailRendererRef.value?.resetTrailAndOffset()
  isTrailStopped.value = false // Playback finished
}

// Watch trail point count and trail control state to automatically determine whether to show TrailReviewTimeline or start playback directly
watch(
  [
    () => trailControlRef.value?.showDriftTrails,
    () => trailRendererRef.value?.getTrailStats?.().pointCount,
    () => currentPresetId.value
  ],
  ([showDriftTrails, _pointCount, presetId]) => {
    // Trail control enabled and trail point count reaches 1/3
    const stats = trailRendererRef.value?.getTrailStats?.()
    const enoughTrail = stats && stats.enabled && stats.pointCount > stats.maxTrailPoints / 3
    if (showDriftTrails && enoughTrail) {
      if (presetId === 'drift-follow') {
        // Only auto-playback when explicitly in drift-follow preset
        if (!isReviewingTrail.value) {
          // Get trail snapshot and start review
          const trailPoints = trailRendererRef.value?.getTrailSnapshot?.()
          startTrailReview(trailPoints)
        }
      } else {
        // Show available tip for other presets
        if (!isReviewingTrail.value) {
          isTrailReviewAvailable.value = true
        }
      }
    } else {
      isTrailReviewAvailable.value = false
    }
  },
  { immediate: true }
)

onMounted(() => {
  // Use nextTick to ensure TresCanvas components are ready
  nextTick(() => {
    // Initialize camera controller
    cameraController = new CameraController(cameraRef, orbitControlsRef)

    // Initialize drift runtime checker in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        DriftRuntimeChecker.startMonitoring()
      }, 2000)
    }
  })
})

const isTrailStopped = ref(false)
provide('isTrailStopped', isTrailStopped)

const gridOn = ref(false)
const trailOn = ref(false)
const starOn = ref(false)

function handleToggleGrid() {
  gridOn.value = !gridOn.value

  if (gridOn.value) {
    // If grid is enabled, adjust camera and show grid
    showGridAfterCameraMove.value = false
    cameraController?.adjustForGrid(() => {
      showGridAfterCameraMove.value = true
    })
  } else {
    // If grid is disabled, hide it immediately
    showGridAfterCameraMove.value = false
  }

  showGridAfterCameraMove.value = false

}
function handleToggleTrail() {
  trailOn.value = !trailOn.value

}

function handleToggleStar() {
  starOn.value = !starOn.value

}
</script>

<template>
  <div class="galaxy-container">
    <!-- Galaxy drift controller (invisible but manages galaxy center) -->
    <GalaxyDriftController ref="galaxyDriftControllerRef">
      <template #default>
        <ToolsMenuBar />
      </template>
    </GalaxyDriftController>
    <TresCanvas v-bind="gl">
      <!-- Renderer stats collector (invisible component for performance monitoring) -->
      <RendererStatsCollector />
      <TresPerspectiveCamera ref="cameraRef" :position="[10, 8, 10]" :fov="60" />
      <!-- Subtle ambient lighting for better 3D perception -->
      <TresAmbientLight :intensity="0.08" color="#004488" />
      <!-- Star cluster component - conditional display with ref -->
      <StarCluster v-if="starOn" :ref="(el) => starControlRef && (starControlRef.starClusterRef = el)"
        :skip-evolution="hasEvolutionOccurred" @evolution-complete="hasEvolutionOccurred = true" />
      <!-- TrailRenderer needs a ref -->
      <TrailRenderer ref="trailRendererRef" :enabled="trailControlRef?.showDriftTrails" />
      <OrbitalSystem />
      <!-- OrbitControls with zoom and angle limits -->
      <OrbitControls ref="orbitControlsRef" v-bind="orbitControlsConfig" />
      <!-- Grid Helper - shown only after camera adjustment -->
      <TresGridHelper v-if="gridOn && showGridAfterCameraMove" :args="[16, 16, '#003366', '#002244']"
        :position="[0, -4.2, 0]" />
    </TresCanvas>
    <!-- Control panels -->
    <SwitchMenuBar :grid-on="gridOn" :trail-on="trailOn" :star-on="starOn" :on-toggle-grid="handleToggleGrid"
      :on-toggle-trail="handleToggleTrail" :on-toggle-star="handleToggleStar" :disabled="controlsDisabled" />
    <CameraInfo />
    <!-- Evolution timeline (top center) -->
    <EvolutionTimeline @visible-change="handleEvolutionTimelineVisible" />
    <TrailReviewTimeline v-if="isReviewingTrail" :progress="trailReviewProgress" />
    <TrailReviewTimeline v-else-if="isTrailReviewAvailable" :progress="0" mode="available" />
  </div>
</template>

<style scoped>
.galaxy-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
