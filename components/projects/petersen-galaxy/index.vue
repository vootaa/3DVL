<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping } from 'three'
import { ref, provide, watch, onMounted } from 'vue'
import OrbitalSystem from './components/OrbitalSystem.vue'
import StarCluster from './components/StarCluster.vue'
import StarControl from './components/StarControl.vue'
import GridControl from './components/GridControl.vue'
import CameraInfo from './components/CameraInfo.vue'
import GalaxyDriftController from './components/GalaxyDriftController.vue'
import { CameraController } from './utils/camera-controller'

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

// Camera controller instance
let cameraController: CameraController

provide('camera', cameraRef)

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
  // Initialize camera controller
  cameraController = new CameraController(cameraRef, orbitControlsRef)
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
      <TresPerspectiveCamera ref="cameraRef" :position="[10, 8, 10]" :fov="60" />
      
      <!-- Subtle ambient lighting for better 3D perception -->
      <TresAmbientLight :intensity="0.05" color="#004488" />

      <!-- Grid Helper - shown only after camera adjustment -->
      <TresGridHelper 
        v-if="gridControlRef?.showGrid && showGridAfterCameraMove"
        :size="20" 
        color1="#002244" 
        color2="#001122"
        :position="[0, -4.5, 0]"
      />
      
      <OrbitalSystem />
      
      <!-- Star cluster component - conditional display with ref -->
      <StarCluster 
        v-if="starControlRef?.showStars" 
        :ref="(el) => starControlRef && (starControlRef.starClusterRef = el)"
      />
      
      <!-- OrbitControls with zoom and angle limits -->
      <OrbitControls 
        ref="orbitControlsRef"
        v-bind="orbitControlsConfig"
      />
    </TresCanvas>
    
    <!-- Control panels -->
    <StarControl ref="starControlRef" />
    <GridControl ref="gridControlRef" />
    <CameraInfo />
  </div>
</template>

<style scoped>
.galaxy-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
