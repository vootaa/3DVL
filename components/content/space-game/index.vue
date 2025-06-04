<!-- eslint-disable no-console -->
<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { SRGBColorSpace, NoToneMapping, PerspectiveCamera } from 'three'
import { onMounted, onUnmounted, provide, shallowRef, ref, watch } from 'vue'

import { GameController } from './core/GameController'
import { gameStateManager } from './core/GameStateManager'

import { ResourceLoader } from './utils/ResourceLoader'

import LaunchScreen from './controls/LaunchScreen.vue'
import SoundControl from './controls/SoundControl.vue'
import InfoTextControl from './controls/InfoTextControl.vue'
import ControlPanel from './controls/ControlPanel.vue'
import ObservationControls from './controls/ObservationControls.vue'
import HudControl from './controls/HudControl.vue'
import Game from './Game.vue'

import { initializeAudio } from './utils/audio'

import { gameStore } from './GameStore'

// Provide game store and controller
provide('gameStore', gameStore)

const cameraRef = shallowRef(new PerspectiveCamera())

const isMounted = ref(false)
const resourcesLoaded = ref(false)
const loadingProgress = ref(0)
const gameActive = ref(false)

let gameController: GameController | null = null

onMounted(async () => {
  isMounted.value = true
  await ResourceLoader.loadAllResources()
})

onUnmounted(() => {
  isMounted.value = false
  if (gameController) {
    gameController.cleanup()
    gameController = null
  }
})

// Monitor resource loading progress
watch(() => ResourceLoader.loadingProgress, (newVal) => {
  loadingProgress.value = newVal
})

// Monitor resource loading completion status
watch(() => ResourceLoader.isLoaded, (newVal) => {
  resourcesLoaded.value = newVal
})

const initializeGame = async () => {
  if (!isMounted.value || !cameraRef.value) return

  try {
    // Initialize audio system
    const audioSystem = await initializeAudio(cameraRef.value)
    gameStore.audioSystem = audioSystem
  } catch (error) {
    console.error('Failed to initialize audio:', error)
    gameStore.audioError = true
    gameStore.sound = false
  }

  if (!isMounted.value) return

  // Initialize game controller
  gameController = new GameController(gameStore)

  // Provide game controller to child components
  provide('gameController', gameController)

  // Initialize camera
  if (cameraRef.value) {
    gameStore.camera = cameraRef.value
    gameStore.camera.far = 10000
    gameStore.actions.init(cameraRef.value)
  }

  // Start game clock
  gameStore.mutation.clock.start()

  if (isMounted.value) {
    gameActive.value = true
    console.log('Game initialized successfully')
  }
}

const start = async (mode: 'battle' | 'explore') => {
  if (!isMounted.value || !resourcesLoaded.value) return

  await initializeGame()

  if (!gameController) return

  // Start the selected game mode
  if (mode === 'battle') {
    gameController.startBattleMode()
  } else {
    gameController.startExploreMode()
  }
}
</script>

<template>
  <div>
    <LaunchScreen v-if="gameStateManager.isLaunchMode()" :resources-loaded="resourcesLoaded" :progress="loadingProgress" @launch="start" />
    <div v-if="!gameStateManager.isLaunchMode()" class="full-screen">
      <TresCanvas clear-color="#010104" :linear="true" :flat="true" :antialias="false" :tone-mapping="NoToneMapping"
        :output-encoding="SRGBColorSpace">
        <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 2000]" :near="0.01" :far="10000"
          :fov="gameStore.mutation.fov" />
        <TresFog color="#121225" :near="150" :far="600" />
        <Game />
      </TresCanvas>

      <SoundControl />
      <InfoTextControl v-if="gameStateManager.enableInfoTextControl()"/>
      <ControlPanel v-if="gameStateManager.enableGameModeSwitching()" />
      <ObservationControls v-if="gameStateManager.enableObservationControl()" />
      <HudControl/>
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
