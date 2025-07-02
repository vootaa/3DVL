<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three'
import { ref, provide, watch, onMounted, nextTick } from 'vue'
import OrbitalSystem from './components/OrbitalSystem.vue'
import StarCluster from './components/StarCluster.vue'
import StarControl from './components/StarControl.vue'
import GridControl from './components/GridControl.vue'
import CameraInfo from './components/CameraInfo.vue'
import GalaxyDriftController from './components/GalaxyDriftController.vue'
import DriftMonitor from './components/DriftMonitor.vue'
import PerformanceMonitor from './components/PerformanceMonitor.vue'
import CameraPresets from './components/CameraPresets.vue'
import RendererStatsCollector from './components/RendererStatsCollector.vue'
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
  console.log('🚀 Galaxy component mounted')
  
  // Use nextTick to ensure TresCanvas components are ready
  nextTick(() => {
    console.log('📸 After nextTick - Camera ref:', !!cameraRef.value)
    console.log('🎮 After nextTick - Controls ref:', !!orbitControlsRef.value)
    
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
    <GalaxyDriftController />

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

      <!-- OrbitControls with zoom and angle limits -->
      <OrbitControls ref="orbitControlsRef" v-bind="orbitControlsConfig" />
    </TresCanvas>

    <!-- Control panels -->
    <StarControl ref="starControlRef" />
    <GridControl ref="gridControlRef" />
    <CameraInfo />
    
    <!-- Drift debugging monitor -->
    <DriftMonitor />
    
    <!-- Performance monitor -->
    <PerformanceMonitor />
    
    <!-- Camera presets component -->
    <CameraPresets />
  </div>
</template>

<style scoped>
.galaxy-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
