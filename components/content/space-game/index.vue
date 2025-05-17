<!-- eslint-disable no-console -->
<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { SRGBColorSpace, NoToneMapping, PerspectiveCamera } from 'three'
import { onMounted, provide, shallowRef, ref, watch, nextTick } from 'vue'

import Game from './Game.vue'
import { gameStore } from './GameStore'
import { GameMode } from './store/constants'
import { initializeActions } from './store/actions'
import { ResourceLoader } from './utils/ResourceLoader'

import LaunchScreen from './controls/LaunchScreen.vue'

import SoundControl from './controls/SoundControl.vue'
import InfoTextControl from './controls/InfoTextControl.vue'
import ControlPanel from './controls/ControlPanel.vue'
import ObservationControls from './controls/ObservationControls.vue'
import HudControl from './controls/HudControl.vue'

import * as audio from './audio'

provide('gameStore', gameStore)
const cameraRef = shallowRef(new PerspectiveCamera())

const resourcesLoaded = ref(false)
const loadingProgress = ref(0)
const gameActive = ref(false)

onMounted(async () => {
  // Start loading resources
  await ResourceLoader.loadAllResources()
})

// Monitor resource loading progress
watch(() => ResourceLoader.loadingProgress, (newVal) => {
  loadingProgress.value = newVal
})

// Monitor resource loading completion status
watch(() => ResourceLoader.isLoaded, (newVal) => {
  resourcesLoaded.value = newVal
})

const handleMouseMove = (event: PointerEvent) => {
  if (gameStore.actions.updateMouse) {
    gameStore.actions.updateMouse({
      clientX: event.clientX,
      clientY: event.clientY,
    })
  }
  else {
    console.warn('updateMouse action not available')
  }
}

const initializeGame = () => {
  if (cameraRef.value) {
    console.log('Initializing game with camera:', cameraRef.value)
    gameStore.actions.init(cameraRef.value)

    gameStore.actions.updateMouse({
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
    })

    gameActive.value = true
    console.log('Game activated')
  }
  else {
    console.error('Cannot start game: No camera reference available')
  }
}

const start = (mode: 'battle' | 'explore') => {
  console.log('Start function called with mode:', mode)
  console.log('Resources loaded status:', resourcesLoaded.value)

  if (!resourcesLoaded.value) {
    console.warn('Resources not fully loaded, cannot start game')
    return
  }

  console.log('Setting game mode to:', mode)
  if (mode === 'battle') {
    gameStore.gameMode = GameMode.Battle
  }
  else {
    gameStore.gameMode = GameMode.Explore
  }

  // Initialize actions & start game
  initializeActions(gameStore, audio)
  gameStore.actions.startGame(false)

  nextTick(() => {
    initializeGame()
  })
}
</script>

<template>
  <div>
    <LaunchScreen
      v-if="!gameActive"
      :resources-loaded="resourcesLoaded"
      :progress="loadingProgress"
      @launch="start"
    />

    <div
      v-if="gameActive"
      class="full-screen"
      @pointermove="handleMouseMove"
      @pointerdown="gameStore.actions.shoot"
    >
      <TresCanvas
        clear-color="#010104"
        :linear="true"
        :flat="true"
        :antialias="false"
        :tone-mapping="NoToneMapping"
        :output-encoding="SRGBColorSpace"
      >
        <TresPerspectiveCamera
          ref="cameraRef"
          :position="[0, 0, 2000]"
          :near="0.01"
          :far="20000"
          :fov="gameStore.mutation.fov"
        />
        <TresFog
          color="#121225"
          :near="150"
          :far="600"
        />
        <Game />
      </TresCanvas>
      <SoundControl />
      <InfoTextControl />
      <ControlPanel />
      <ObservationControls />
      <HudControl />
    </div>
  </div>
</template>

<style scoped>
.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
