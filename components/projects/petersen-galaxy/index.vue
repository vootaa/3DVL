<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three'
import { ref, provide, watch, onMounted, nextTick, computed } from 'vue'
import OrbitalSystem from './components/scene/OrbitalSystem.vue'
import StarCluster from './components/scene/StarCluster.vue'
import TrailRenderer from './components/scene/TrailRenderer.vue'
import StarControl from './components/controls/StarControl.vue'
import GridControl from './components/controls/GridControl.vue'
import TrailControl from './components/controls/TrailControl.vue'
import CameraInfo from './components/hud/CameraInfo.vue'
import GalaxyDriftController from './components/scene/GalaxyDriftController.vue'
import DriftMonitor from './components/hud/DriftMonitor.vue'
import PerformanceMonitor from './components/hud/PerformanceMonitor.vue'
import CameraPresets from './components/hud/CameraPresets.vue'
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

const gridControlRef = ref()
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

// Trail review trigger function (called by CameraPresets)
async function startTrailReview(trailPoints: any[]) {
  if (!trailPoints || trailPoints.length < 2) return
  isTrailReviewAvailable.value = false
  isReviewingTrail.value = true
  isTrailStopped.value = true // Stop sampling and new data rendering
  trailReviewProgress.value = 0
  const galaxyDriftController = galaxyDriftControllerRef.value
  if (galaxyDriftController?.startTrailReview) {
    await galaxyDriftController.startTrailReview(trailPoints, (progress: number) => {
      trailReviewProgress.value = progress
    })
  }
  isReviewingTrail.value = false
  isTrailStopped.value = false // Playback finished, resume sampling and rendering
  trailReviewProgress.value = 0
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
          isTrailReviewAvailable.value = false
          // Get trail snapshot and start review
          const trailPoints = trailRendererRef.value?.getTrailSnapshot?.()
          if (trailPoints && trailPoints.length > 1) {
            startTrailReview(trailPoints)
          }
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

// Handle grid visibility changes
watch(
  () => gridControlRef.value?.showGrid,
  async (showGrid) => {
    if (showGrid) {
      // Hide grid first, move camera, then show grid
      showGridAfterCameraMove.value = false
      cameraController?.adjustForGrid(() => {
        showGridAfterCameraMove.value = true
      })
    } else {
      // Hide grid when disabled
      showGridAfterCameraMove.value = false
    }
  },
  { flush: 'post' }
)

const isTrailStopped = ref(false)
provide('isTrailStopped', isTrailStopped)
</script>

<template>
  <div class="galaxy-container">
    <!-- Galaxy drift controller (invisible but manages galaxy center) -->
    <GalaxyDriftController ref="galaxyDriftControllerRef">
      <template #default>
        <!-- Drift debugging monitor -->
        <DriftMonitor />
      </template>
    </GalaxyDriftController>

    <TresCanvas v-bind="gl">
      <!-- Renderer stats collector (invisible component for performance monitoring) -->
      <RendererStatsCollector />

      <TresPerspectiveCamera ref="cameraRef" :position="[10, 8, 10]" :fov="60" />

      <!-- Subtle ambient lighting for better 3D perception -->
      <TresAmbientLight :intensity="0.08" color="#004488" />

      <!-- Grid Helper - shown only after camera adjustment -->
      <TresGridHelper v-if="gridControlRef?.showGrid && showGridAfterCameraMove" :args="[16, 16, '#003366', '#002244']"
        :position="[0, -4.2, 0]" />

      <OrbitalSystem />

      <!-- Star cluster component - conditional display with ref -->
      <StarCluster v-if="starControlRef?.showStars"
        :ref="(el) => starControlRef && (starControlRef.starClusterRef = el)" :skip-evolution="hasEvolutionOccurred"
        @evolution-complete="hasEvolutionOccurred = true" />

      <!-- TrailRenderer needs a ref -->
      <TrailRenderer ref="trailRendererRef" :enabled="trailControlRef?.showDriftTrails" />

      <!-- OrbitControls with zoom and angle limits -->
      <OrbitControls ref="orbitControlsRef" v-bind="orbitControlsConfig" />
    </TresCanvas>

    <!-- Control panels -->
    <StarControl ref="starControlRef" :disabled="controlsDisabled" />
    <GridControl ref="gridControlRef" :disabled="controlsDisabled" />
    <TrailControl ref="trailControlRef" :disabled="controlsDisabled" />
    <CameraInfo />

    <!-- Evolution timeline (top center) -->
    <EvolutionTimeline @visible-change="handleEvolutionTimelineVisible" />

    <!-- Performance monitor - needs client-only for performance stats -->
    <ClientOnly>
      <PerformanceMonitor />
    </ClientOnly>

    <!-- Camera presets component -->
    <CameraPresets />
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
