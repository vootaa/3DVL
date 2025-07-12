<script setup lang="ts">
import { BasicShadowMap, SRGBColorSpace, NoToneMapping, Vector3 } from 'three'
import { ref, provide, onMounted, nextTick } from 'vue'
import { OrbitControls } from '@tresjs/cientos'

import Stars from '../echo-mission/3d/Stars.vue'

import Tethers from './components/scene/TethersTest.vue'

import GridDotBox from './components/scene/GridDotBox.vue'
import OrbitalSystem from './components/scene/OrbitalSystem.vue'
import StellarCore from './components/scene/StellarCore.vue'

import EvolutionAnimator from './components/animation/EvolutionAnimator.vue'

import SwitchMenuBar from './components/menu/SwitchMenuBar.vue'
import ToolsMenuBar from './components/menu/ToolsMenuBar.vue'

import CameraInfo from './components/hud/CameraInfo.vue'
import EvolutionTimeline from './components/hud/EvolutionTimeline.vue'

import RendererStatsCollector from '../../utils/RendererStatsCollector.vue'
import { CameraController } from '../../utils/camera-controller'
import { useEvolutionState } from './composables/useEvolutionState'

const gl = {
  clearColor: '#000811',
  shadows: true,
  alpha: false,
  shadowMapType: BasicShadowMap,
  outputColorSpace: SRGBColorSpace,
  toneMapping: NoToneMapping,
}

const cameraRef = ref()
const orbitControlsRef = ref()
const evolutionAnimatorRef = ref()
const showGridAfterCameraMove = ref(false)
const gridOn = ref(false)

const {
  state,
  timelineVisible,
  startEvolution,
  resetEvolution,
  toggleStellarCore,
  toggleOrbitalSystem,
  toggleTethers,
  updateEvolutionProgress,
  onEvolutionComplete,
  controlsDisabled
} = useEvolutionState()

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

const currentPresetId = ref<string | null>(null)
const galaxyCenter = ref(new Vector3(0, 0, 0))

function setCurrentPresetId(id: string | null) {
  currentPresetId.value = id
}
provide('setCurrentPresetId', setCurrentPresetId)

const stellarCoreRef = ref()

onMounted(() => {
  nextTick(() => {
    cameraController = new CameraController(cameraRef, orbitControlsRef)

    setTimeout(() => {
      startEvolution()
      evolutionAnimatorRef.value?.start()
    }, 1000)
  })
})

function handleEvolutionProgress(progress: number) {
  updateEvolutionProgress(progress)
}

function handleEvolutionComplete() {
  onEvolutionComplete()
}

function handleEvolutionStart() {
  // Called when evolution animation starts
}

function handleEvolutionReset() {
  resetEvolution()
  setTimeout(() => {
    evolutionAnimatorRef.value?.start()
  }, 100)
}

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

function handleToggleStellarCore() {
  toggleStellarCore()
}

function handleToggleOrbitalSystem() {
  toggleOrbitalSystem()
}

function handleToggleTethers() {
  toggleTethers()
}

function handleEvolutionTimelineVisible(_val: boolean) {
  // Timeline visibility is managed by evolution state
}
</script>

<template>
  <div class="galaxy-container">
    <TresCanvas v-bind="gl">
      <RendererStatsCollector />
      <TresPerspectiveCamera ref="cameraRef" :position="[0, 400, 2000]" :fov="75" :near="0.01" :far="10000" />
      <TresAmbientLight :intensity="0.08" color="#004488" />

      <StellarCore ref="stellarCoreRef" :camera-ref="cameraRef" :galaxy-center="galaxyCenter"
        :global-time="state.globalTime" :evolution-progress="state.evolutionProgress"
        :enabled="state.stellarCoreEnabled" />

      <OrbitalSystem :camera-ref="cameraRef" :galaxy-center="galaxyCenter" :global-time="state.globalTime"
        :evolution-progress="state.evolutionProgress" :enabled="state.orbitalSystemEnabled" />

      <Tethers :camera-ref="cameraRef" :galaxy-center="galaxyCenter" :global-time="state.globalTime"
        :evolution-progress="state.evolutionProgress" :enabled="state.tethersEnabled" />

      <Stars />

      <OrbitControls ref="orbitControlsRef" v-bind="orbitControlsConfig" />
      <GridDotBox :enabled="gridOn" :galaxy-center=" galaxyCenter" />
      <TresGridHelper v-if="gridOn && showGridAfterCameraMove" :args="[16, 16, '#003366', '#002244']"
        :position="[0, -4.2, 0]" />
      <TresAxesHelper v-if="gridOn" :args="[1]" :position="[0, 0, 0]" />
    </TresCanvas>

    <EvolutionAnimator ref="evolutionAnimatorRef" :enabled="state.stellarCoreEnabled && state.orbitalSystemEnabled"
      :duration="13.8" :global-time="state.globalTime" @progress="handleEvolutionProgress"
      @complete="handleEvolutionComplete" @start="handleEvolutionStart" @reset="handleEvolutionReset" />

    <SwitchMenuBar :grid-on="gridOn" :stellar-core-on="state.stellarCoreEnabled"
      :orbital-system-on="state.orbitalSystemEnabled" :tethers-on="state.tethersEnabled"
      :on-toggle-grid="handleToggleGrid" :on-toggle-stellar-core="handleToggleStellarCore"
      :on-toggle-orbital-system="handleToggleOrbitalSystem" :on-toggle-tethers="handleToggleTethers"
      :disabled="controlsDisabled" />

    <ToolsMenuBar />
    <CameraInfo />

    <EvolutionTimeline :visible="timelineVisible" :evolution-progress="state.evolutionProgress"
      @visible-change="handleEvolutionTimelineVisible" />
  </div>
</template>

<style scoped>
.galaxy-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>