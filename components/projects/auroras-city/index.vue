<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, ACESFilmicToneMapping } from 'three'
import { ref, provide } from 'vue'

//import ChainwebSimple from './components/scene/ChainwebSimple.vue'
import BandedCylinder from './components/scene/BandedCylinder.vue'
import ConcentricBase from './components/scene/ConcentricBase.vue'

import SwitchMenuBar from './components/menu/SwitchMenuBar.vue'
import ToolsMenuBar from './components/menu/ToolsMenuBar.vue'

import KeyboardCameraControls from './components/controls/KeyboardCameraControls.vue'

import PetersenGraphPlane from '../echo-mission/3d/PetersenGraphPlane.vue'

import PostEffects from '../../utils/PostEffects.vue'

import RendererStatsCollector from '../../utils/RendererStatsCollector.vue'

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
const gridOn = ref(true)
const bandedCylinderOn = ref(false)
const chainwebOn = ref(false)
const concentricBaseOn = ref(false)
const firstPersonOn = ref(true)

provide('camera', cameraRef)

function handleToggleGrid() {
  gridOn.value = !gridOn.value
}

function handleToggleBandedCylinder() {
  bandedCylinderOn.value = !bandedCylinderOn.value
}

function handleToggleChainweb() {
  chainwebOn.value = !chainwebOn.value
}

function handleToggleConcentricBase() {
  concentricBaseOn.value = !concentricBaseOn.value
}

function handleToggleFirstPerson() {
  firstPersonOn.value = !firstPersonOn.value
}

</script>

<template>
  <div class="shader-container">
    <TresCanvas v-bind="gl">
      <RendererStatsCollector />
      <TresPerspectiveCamera ref="cameraRef" :position="[0, 2, 10]" :fov="75" :near="0.1" :far="1000" />、
      <KeyboardCameraControls v-if="firstPersonOn" />
      <TresAmbientLight :intensity="0.3" color="#ffffff" />

      <TresGroup>

        <!-- BandedCylinder shader effect -->
        <BandedCylinder v-if="bandedCylinderOn" :position="[0.2, 7, -0.2]" :rotation-speed="-0.45"
          :cylinder-args="[0.5, 4.5, 48, 0.45, 0.15]" />
        <BandedCylinder v-if="bandedCylinderOn" :position="[-0.2, 7, 0.2]" :rotation-speed="0.45"
          :cylinder-args="[0.5, 4.5, 48, 0.45, -0.15]" />

        <ConcentricBase v-if="concentricBaseOn" :position="[0, 2, 0]" :scale="[1.0, 1.0, 1.0]" :rotation-speed="0.1" />

        <PetersenGraphPlane :position="[0, 20, -20]" :rotation="[0, 0, 0]" :scale="1" />

        <!-- Post-processing effects -->
        <PostEffects :bloom-strength="0.4" :bloom-radius="0.5" :bloom-threshold="0.2" :noise-shader="false" />

      </TresGroup>

      <!-- Debug helpers -->
      <TresGridHelper v-if="gridOn" :args="[150, 150, '#113366', '#224488']" :position="[0, 0, 0]" />
      <TresAxesHelper v-if="gridOn" :args="[7.5]" :position="[0, 0, 0]" />
    </TresCanvas>

    <SwitchMenuBar :grid-on="gridOn" :on-toggle-grid="handleToggleGrid" :banded-cylinder-on="bandedCylinderOn"
      :on-toggle-banded-cylinder="handleToggleBandedCylinder" :chainweb-simple-on="chainwebOn"
      :on-toggle-chainweb="handleToggleChainweb" :concentric-base-on="concentricBaseOn"
      :on-toggle-concentric-base="handleToggleConcentricBase" :first-person-on="firstPersonOn"
      :on-toggle-first-person="handleToggleFirstPerson" :disabled="false" />
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