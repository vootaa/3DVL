<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, ACESFilmicToneMapping } from 'three'
import { ref, provide, onMounted, nextTick } from 'vue'

import Stars from '../echo-mission/3d/Stars.vue'
import PetersenGraphPlane from '../echo-mission/3d/PetersenGraphPlane.vue'

//import ChainwebSimple from './components/scene/ChainwebSimple.vue'
import Chainweb3D from './components/scene/Chainweb3D.vue'
//import ChainwebGeometry from './components/scene/ChainwebGeometry.vue'
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
const bandedCylinderOn = ref(false)
const chainwebSimpleOn = ref(false)
const concentricBaseOn = ref(false)

let cameraController: CameraController

provide('camera', cameraRef)
provide('orbitControls', orbitControlsRef)

const orbitControlsConfig = {
  enableDamping: true,
  dampingFactor: 0.05,
  minDistance: 0,
  maxDistance: 15,
  minPolarAngle: Math.PI * 0.05,
  maxPolarAngle: Math.PI * 0.9,
  enablePan: true,
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

function handleToggleBandedCylinder() {
  bandedCylinderOn.value = !bandedCylinderOn.value
}

function handleToggleChainwebSimple() {
  chainwebSimpleOn.value = !chainwebSimpleOn.value
}

function handleToggleConcentricBase() {
  concentricBaseOn.value = !concentricBaseOn.value
}

</script>

<template>
  <div class="shader-container">
    <TresCanvas v-bind="gl">
      <RendererStatsCollector />
      <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 2000]" :fov="75" :near="0.01" :far="10000" />
      <TresAmbientLight :intensity="0.3" color="#ffffff" />

      <!-- BandedCylinder shader effect -->
      <BandedCylinder v-if="bandedCylinderOn" :position="[0.2, 7, -0.2]" :rotation-speed="-0.45"
        :cylinder-args="[0.5, 4.5, 48, 0.45, 0.15]" />
      <BandedCylinder v-if="bandedCylinderOn" :position="[-0.2, 7, 0.2]" :rotation-speed="0.45"
        :cylinder-args="[0.5, 4.5, 48, 0.45, -0.15]" />

      <!--<ChainwebSimple v-if="chainwebSimpleOn" :position="[0, -2.5, 0]" :layer-count="15" :height-spacing="0.45" />-->
      <Chainweb3D v-if="chainwebSimpleOn" :radiusScale ="1" />

      <ConcentricBase v-if="concentricBaseOn" :position="[0, -5, 0]" :scale="[1.0, 1.0, 1.0]" :rotation-speed="0.1" />

      <Stars />
      <PetersenGraphPlane :position="[0, 20, -20]" :rotation="[0, 0, 0]" :scale="1" />

      <!-- Camera controls -->
      <OrbitControls ref="orbitControlsRef" v-bind="orbitControlsConfig" />

      <!-- Post-processing effects -->
      <PostEffects :bloom-strength="0.4" :bloom-radius="0.5" :bloom-threshold="0.2" />

      <!-- Debug helpers -->
      <TresGridHelper v-if="gridOn && showGridAfterCameraMove" :args="[15, 15, '#113366', '#224488']"
        :position="[0, -5.1, 0]" />
      <TresAxesHelper v-if="gridOn" :args="[7.5]" :position="[0, 0, 0]" />
    </TresCanvas>

    <SwitchMenuBar :grid-on="gridOn" :on-toggle-grid="handleToggleGrid" :banded-cylinder-on="bandedCylinderOn"
      :on-toggle-banded-cylinder="handleToggleBandedCylinder" :chainweb-simple-on="chainwebSimpleOn"
      :on-toggle-chainweb-simple="handleToggleChainwebSimple" :concentric-base-on="concentricBaseOn"
      :on-toggle-concentric-base="handleToggleConcentricBase" :disabled="false" />
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