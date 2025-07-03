<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three'
import { ref, provide, watch, onMounted, nextTick } from 'vue'
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
import RendererStatsCollector from './components/utilities/RendererStatsCollector.vue'
import { CameraController } from './utils/camera-controller'
import './utils/drift-validator' // Import to trigger auto-diagnostic
import DriftRuntimeChecker from './utils/drift-runtime-checker'

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
</script>

<template>
  <div class="galaxy-container">
    <!-- Galaxy drift controller (invisible but manages galaxy center) -->
    <!-- Note: GalaxyDriftController needs to include other dependent components -->
    <GalaxyDriftController>
      <!-- Place components that need injected data here -->
      <template #default>
        <!-- Drift debugging monitor - Client Render -->
        <ClientOnly>
          <DriftMonitor />
        </ClientOnly>
      </template>
    </GalaxyDriftController>

    <TresCanvas v-bind="gl">
      <!-- Renderer stats collector (invisible component for performance monitoring) - Client Render -->
      <ClientOnly>
        <RendererStatsCollector />
      </ClientOnly>

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

      <!-- Trail renderer - conditional display based on trail control - Client Render -->
      <ClientOnly>
        <TrailRenderer :enabled="trailControlRef?.showDriftTrails" />
      </ClientOnly>

      <!-- OrbitControls with zoom and angle limits -->
      <OrbitControls ref="orbitControlsRef" v-bind="orbitControlsConfig" />
    </TresCanvas>

    <!-- Control panels -->
    <StarControl ref="starControlRef" />
    <GridControl ref="gridControlRef" />
    <TrailControl ref="trailControlRef" />
    <CameraInfo />

    <!-- Evolution timeline (top center) -->
    <EvolutionTimeline />

    <!-- Performance monitor - Client Render -->
    <ClientOnly>
      <PerformanceMonitor />
    </ClientOnly>

    <!-- Camera presets component - Client Render -->
    <ClientOnly>
      <CameraPresets />
    </ClientOnly>
  </div>
</template>

<style scoped>
.galaxy-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
