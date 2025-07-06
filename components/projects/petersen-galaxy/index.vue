<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, Vector3 } from 'three'
import { ref, provide, onMounted, nextTick, computed } from 'vue'
import OrbitalSystem from './components/scene/OrbitalSystem.vue'
import StarCluster from './components/scene/StarCluster.vue'
import SwitchMenuBar from './components/menu/SwitchMenuBar.vue'
import ToolsMenuBar from './components/menu/ToolsMenuBar.vue'
import CameraInfo from './components/hud/CameraInfo.vue'
import EvolutionTimeline from './components/hud/EvolutionTimeline.vue'
import RendererStatsCollector from './components/utilities/RendererStatsCollector.vue'
import { CameraController } from './utils/camera-controller'


const gl = {
  clearColor: '#000811',
  shadows: true,
  alpha: false,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
}

const starClusterRef = ref()
const cameraRef = ref()
const orbitControlsRef = ref()
const showGridAfterCameraMove = ref(false)

const gridOn = ref(false)
const starOn = ref(true)

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

const currentPresetId = ref<string | null>(null) // Current camera preset id

// EvolutionTimeline visibility state
const isEvolutionTimelineVisible = ref(false)
function handleEvolutionTimelineVisible(val: boolean) {
  isEvolutionTimelineVisible.value = val
}

const controlsDisabled = computed(() =>
  isEvolutionTimelineVisible.value
)


// Provide for CameraPresets to record the current preset
function setCurrentPresetId(id: string | null) {
  currentPresetId.value = id
}
provide('setCurrentPresetId', setCurrentPresetId)


const galaxyCenter = ref(new Vector3(0, 0, 0))

onMounted(() => {
  // Use nextTick to ensure TresCanvas components are ready
  nextTick(() => {
    // Initialize camera controller
    cameraController = new CameraController(cameraRef, orbitControlsRef)
  })
})

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

function handleToggleStar() {
  starOn.value = !starOn.value

  if (starOn.value && starClusterRef.value?.resetStarsPosition) {
    starClusterRef.value.resetStarsPosition()
  }
}
</script>

<template>
  <div class="galaxy-container">
    <TresCanvas v-bind="gl">
      <RendererStatsCollector />
      <TresPerspectiveCamera ref="cameraRef" :position="[10, 8, 10]" :fov="60" />
      <TresAmbientLight :intensity="0.08" color="#004488" />
      <StarCluster v-if="starOn" ref="starClusterRef" :skip-evolution="hasEvolutionOccurred"
        :galaxy-center="galaxyCenter" @evolution-complete="hasEvolutionOccurred = true" />
      <OrbitalSystem :galaxy-center="galaxyCenter" />
      <OrbitControls ref="orbitControlsRef" v-bind="orbitControlsConfig" />
      <TresGridHelper v-if="gridOn && showGridAfterCameraMove" :args="[16, 16, '#003366', '#002244']"
        :position="[0, -4.2, 0]" />
      <TresAxesHelper v-if="gridOn" :args="[1]" :position="[0, 0, 0]" />
    </TresCanvas>
    <SwitchMenuBar :grid-on="gridOn" :star-on="starOn" :on-toggle-grid="handleToggleGrid"
      :on-toggle-star="handleToggleStar" :disabled="controlsDisabled" />
    <ToolsMenuBar />
    <CameraInfo />
    <EvolutionTimeline @visible-change="handleEvolutionTimelineVisible" />
  </div>
</template>

<style scoped>
.galaxy-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
