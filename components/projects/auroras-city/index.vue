<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, ACESFilmicToneMapping } from 'three'
import { ref, provide, onMounted, nextTick } from 'vue'

import BandedCylinder from './components/scene/BandedCylinder.vue'
import ConcentricBase from './components/scene/ConcentricBase.vue'
import DynamicLights from './components/scene/DynamicLights.vue'
import PostEffects from './components/scene/PostEffects.vue'

import SwitchMenuBar from './components/menu/SwitchMenuBar.vue'
import ToolsMenuBar from './components/menu/ToolsMenuBar.vue'

import RendererStatsCollector from '../../utils/RendererStatsCollector.vue'
import { CameraController } from '../../utils/camera-controller'

const gl = {
  clearColor: '#070707',
  antiAlias: "true",
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

const spotTarget = ref()

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
      <TresPerspectiveCamera ref="cameraRef" :position="[5, 3, 5]" :fov="75" :near="0.1" :far="1000" />
      <TresAmbientLight :intensity="0.8" color="#ffffff" />

      <!-- Dynamic lighting -->
      <DynamicLights :position="[0, 2.5, 0]" :light-count="4" :light-intensity="0.8" :light-distance="8" />

      <!-- BandedCylinder shader effect -->
      <BandedCylinder :position="[0.2, 2.5, -0.2]" :rotation-speed="-0.45"
        :cylinder-args="[0.5, 4.5, 48, 0.45, 0.15]" />
      <BandedCylinder :position="[-0.2, 2.5, 0.2]" :rotation-speed="0.45"
        :cylinder-args="[0.5, 4.5, 48, 0.45, -0.15]" />


      <TresDirectionalLight :target="spotTarget" :intensity="0.2" color="#ffffff" :position="[5, 2, 5]"
        cast-shadow />
      <TresObject3D ref="spotTarget" :position="[5, -1, 5]" />

      <ConcentricBase :position="[0, -2, 0]" :scale="[1.5, 1.0, 1.5]" :rotation-speed="0.1" />

      <!-- Camera controls -->
      <OrbitControls ref="orbitControlsRef" v-bind="orbitControlsConfig" />

      <!-- Post-processing effects -->
      <PostEffects :bloom-strength="0.4" :bloom-radius="0.5" :bloom-threshold="0.2" />

      <!-- Debug helpers -->
      <TresGridHelper v-if="gridOn && showGridAfterCameraMove" :args="[10, 10, '#003366', '#002244']"
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