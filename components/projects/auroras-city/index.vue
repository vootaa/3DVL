<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, ACESFilmicToneMapping } from 'three'
import { ref, provide, onMounted, nextTick } from 'vue'

import Stars from '../echo-mission/3d/Stars.vue'

import BandedCylinder from './components/scene/BandedCylinder.vue'
import ConcentricBase from './components/scene/ConcentricBase.vue'
import PostEffects from './components/scene/PostEffects.vue'

import SwitchMenuBar from './components/menu/SwitchMenuBar.vue'
import ToolsMenuBar from './components/menu/ToolsMenuBar.vue'

import RendererStatsCollector from '../../utils/RendererStatsCollector.vue'
import { CameraController } from '../../utils/camera-controller'

const gl = {
  clearColor: '#010104',
  linear: true,
  flat: true,
  antiAlias: "false",
  shadows: true,
  alpha: true,
  windowSize: true,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: ACESFilmicToneMapping,
  toneMappingExposure: 1.0,
}

const cameraRef = ref()
const orbitControlsRef = ref()
const showGridAfterCameraMove = ref(false)
const gridOn = ref(false)

let cameraController: CameraController

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
  nextTick(() => {
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
    showGridAfterCameraMove.value = false
  }
}

</script>

<template>
  <div class="shader-container">
    <TresCanvas v-bind="gl">
      <RendererStatsCollector />
      <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 2000]" :fov="75" :near="0.01" :far="10000" />
      <TresAmbientLight :intensity="0.3" color="#ffffff" />

      <!-- BandedCylinder shader effect -->
      <BandedCylinder :position="[0.2, 5, -0.2]" :rotation-speed="-0.45"
        :cylinder-args="[0.5, 4.5, 48, 0.45, 0.15]" />
      <BandedCylinder :position="[-0.2, 5, 0.2]" :rotation-speed="0.45"
        :cylinder-args="[0.5, 4.5, 48, 0.45, -0.15]" />

      <ConcentricBase :position="[0, -1.5, 0]" :scale="[1.2, 1.0, 1.2]" :rotation-speed="0.1" />

      <Stars />

      <!-- Camera controls -->
      <OrbitControls ref="orbitControlsRef" v-bind="orbitControlsConfig" />

      <!-- Post-processing effects -->
      <PostEffects :bloom-strength="0.4" :bloom-radius="0.5" :bloom-threshold="0.2" />

      <!-- Debug helpers -->
      <TresGridHelper v-if="gridOn && showGridAfterCameraMove" :args="[15, 20, '#113366', '#224488']"
        :position="[0, -2, 0]" />
      <TresAxesHelper v-if="gridOn" :args="[2]" :position="[0, 0, 0]" />
    </TresCanvas>

    <SwitchMenuBar :grid-on="gridOn" :on-toggle-grid="handleToggleGrid" :disabled="false" />
    <ToolsMenuBar />
  </div>
</template>

<style scoped>
.shader-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>