<!-- eslint-disable no-console -->
<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { SRGBColorSpace, NoToneMapping, PerspectiveCamera } from 'three'
import { onMounted, onUnmounted, provide, shallowRef, ref, watch, nextTick } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import { GameController } from './core/GameController'
import { mouseEventManager } from './core/MouseEventManager'

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

// Provide game controller
const gameController = shallowRef<GameController | null>(null)
provide('gameController', gameController)

const cameraRef = shallowRef(new PerspectiveCamera())

const isMounted = ref(false)
const resourcesLoaded = ref(false)
const loadingProgress = ref(0)
const gameActive = ref(false)

onMounted(async () => {
  isMounted.value = true
  await ResourceLoader.loadAllResources()
})

onUnmounted(() => {
  isMounted.value = false
  if (gameController.value) {
    gameController.value.cleanup()
  }
})
const tresCanvasRef = ref<ComponentPublicInstance | null>(null)

watch(() => gameActive.value, (isActive) => {
  if (isActive) {
    // After game activation, Canvas is rendered, wait for the next render cycle
    nextTick(() => {
      // Get Canvas element and set it to MouseEventManager
      setTimeout(() => {
        // Get the canvas element under the TresCanvas root element
        const canvasElement = tresCanvasRef.value?.$el.querySelector('canvas')
        if (canvasElement) {
          console.log('Setting canvas element to MouseEventManager', canvasElement)
          mouseEventManager.setGameStore(gameStore).setCanvasElement(canvasElement).setActiveState(true)
        } else {
          console.warn('Canvas element not found')
        }
      }, 200) // Short delay to ensure Canvas is fully rendered
    })
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
    try {
      const audioSystem = await initializeAudio(cameraRef.value)
      gameStore.audioSystem = audioSystem
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      gameStore.audioError = true
      gameStore.sound = false
    }

    if (!isMounted.value) return

    await nextTick()

    // Initialize game controller
    gameController.value = new GameController(gameStore)

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
  } catch (error) {
    console.error('Game initialization failed:', error)
    return false
  }

  return true
}

const start = async (mode: 'battle' | 'explore') => {
  if (!isMounted.value || !resourcesLoaded.value) return

  const success = await initializeGame()
  if (!success || !gameController.value) return

  try {
    await nextTick()

    // Start the selected game mode
    if (mode === 'battle') {
      await gameController.value.startBattleMode()
    } else {
      await gameController.value.startExploreMode()
    }
  } catch (error) {
    console.error(`Failed to start ${mode} mode:`, error)
  }
}
</script>

<template>
  <div>
    <LaunchScreen v-if="!gameActive" :resources-loaded="resourcesLoaded" :progress="loadingProgress" @launch="start" />
    <div v-if="gameActive" class="full-screen">
      <TresCanvas ref="tresCanvasRef" clear-color="#010104" :linear="true" :flat="true" :antialias="false"
        :tone-mapping="NoToneMapping" :output-encoding="SRGBColorSpace">
        <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 2000]" :near="0.01" :far="10000"
          :fov="gameStore.mutation.fov" />
        <TresFog color="#121225" :near="150" :far="600" />
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
