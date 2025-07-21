<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, ACESFilmicToneMapping, Vector3 } from 'three'
import { ref, provide } from 'vue'

//import ChainwebSimple from './components/scene/ChainwebSimple.vue'
import BandedCylinder from './components/scene/BandedCylinder.vue'
import ConcentricBase from './components/scene/ConcentricBase.vue'

import ProceduralTerrain from './components/scene/ProceduralTerrain.vue'
import HemisphereDome from './components/scene/HemisphereDome.vue'
import OrbitalRings from './components/scene/OrbitalRings.vue'
import Temples from './components/scene/Temples.vue'
import TetherBridges from './components/scene/TetherBridges.vue'
import BoundaryRing from './components/scene/BoundaryRing.vue'
import ShaderTV from './components/scene/ShaderTV.vue'

//import Staircases from './components/scene/Staircases.vue'

import SwitchMenuBar from './components/menu/SwitchMenuBar.vue'
import ToolsMenuBar from './components/menu/ToolsMenuBar.vue'

import KeyboardCameraControls from './components/controls/KeyboardCameraControls.vue'
import KeyboardHelper from './components/hud/KeyboardHelper.vue'

import PetersenGraphPlane from '../echo-mission/3d/PetersenGraphPlane.vue'

import PostEffects from '../../utils/PostEffects.vue'

import RendererStatsCollector from '../../utils/RendererStatsCollector.vue'

import { petersenGraphDCC } from './shaders/petersen-graph-shader'

import { defaultConfig } from './config/scene-config'

const sceneConfig = ref(defaultConfig)

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
const directionalLightRef = ref()

const gridOn = ref(false)
const bandedCylinderOn = ref(false)
const concentricBaseOn = ref(false)
const firstPersonOn = ref(true)

provide('camera', cameraRef)

function handleToggleGrid() {
  gridOn.value = !gridOn.value
}

function handleToggleBandedCylinder() {
  bandedCylinderOn.value = !bandedCylinderOn.value
}

function handleToggleEnergyEffects() {
  sceneConfig.value.terrain.enableEnergyEffects = !sceneConfig.value.terrain.enableEnergyEffects
}

function handleToggleConcentricBase() {
  concentricBaseOn.value = !concentricBaseOn.value
}

function handleToggleFirstPerson() {
  firstPersonOn.value = !firstPersonOn.value
}

// Keep the directional light direction aligned with the camera
watchEffect(() => {
  if (cameraRef.value && directionalLightRef.value) {
    const camera = cameraRef.value
    const light = directionalLightRef.value
    // Align light direction with camera direction
    const dir = new Vector3()
    camera.getWorldDirection(dir)
    light.position.copy(camera.position)
    light.target.position.copy(camera.position.clone().add(dir))
    light.target.updateMatrixWorld()
  }
})

</script>

<template>
  <div class="shader-container">
    <TresCanvas v-bind="gl">
      <RendererStatsCollector />
      <TresPerspectiveCamera ref="cameraRef" :position="[0, 2.5, 10]" :fov="75" :aspect="1" :near="0.1" :far="1000" />、
      <TresDirectionalLight ref="directionalLightRef" :intensity="1.2" color="#ffffff" :position="[0, 2.5, 10]"
        cast-shadow />

      <TresAmbientLight :intensity="0.6" />
      <TresDirectionalLight :position="[50, 50, 50]" :intensity="1" :castShadow="true" />

      <TresGroup>
        <!-- BandedCylinder shader effect -->
        <BandedCylinder v-if="bandedCylinderOn" :position="[0.5, 8.5, -0.5]" :rotation-speed="-0.75"
          :cylinder-args="[0.75, 7.5, 48, 0.5, 0.15]" />
        <BandedCylinder v-if="bandedCylinderOn" :position="[-0.5, 7.5, 0.5]" :rotation-speed="0.75"
          :cylinder-args="[0.75, 7.5, 48, 0.5, -0.15]" />

        <ConcentricBase v-if="concentricBaseOn" :position="[0, 0.75, 0]" :rotation-speed="0.1" />

        <PetersenGraphPlane :position="[0, 20, 20]" :rotation="[0, 0, 0]" :scale="1" />

        <!-- Post-processing effects -->
        <PostEffects :bloom-strength="0.4" :bloom-radius="0.4" :bloom-threshold="0.15" :noise-shader="false" />

      </TresGroup>

      <!-- Scene components -->
      <TresGroup>
        <ProceduralTerrain :config="sceneConfig" />
        <HemisphereDome :config="sceneConfig" />
        <OrbitalRings :config="sceneConfig" />
        <Temples :config="sceneConfig" />
        <TetherBridges :config="sceneConfig" />
        <BoundaryRing :config="sceneConfig" />

        <ShaderTV :config="sceneConfig"/>

        <!--<Staircases :config="sceneConfig" />-->
      </TresGroup>

      <KeyboardCameraControls v-if="firstPersonOn" :config="sceneConfig" :moveSpeed="0.1" :rotate-speed="0.005"
        :minHeight="0.25" :maxHeight="40" />

      <!-- Debug helpers -->
      <TresGridHelper v-if="gridOn" :args="[150, 150, '#113366', '#224488']" :position="[0, 0.25, 0]" />
      <TresAxesHelper v-if="gridOn" :args="[7.5]" :position="[0, 0, 0]" />
    </TresCanvas>

    <SwitchMenuBar :grid-on="gridOn" :on-toggle-grid="handleToggleGrid" :banded-cylinder-on="bandedCylinderOn"
      :on-toggle-banded-cylinder="handleToggleBandedCylinder"
      :energy-effects-on="sceneConfig.terrain.enableEnergyEffects" :on-toggle-energy-effects="handleToggleEnergyEffects"
      :concentric-base-on="concentricBaseOn" :on-toggle-concentric-base="handleToggleConcentricBase"
      :first-person-on="firstPersonOn" :on-toggle-first-person="handleToggleFirstPerson" :disabled="false" />
    <ToolsMenuBar />
    <KeyboardHelper v-if="firstPersonOn" />
  </div>
</template>

<style scoped>
.shader-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>